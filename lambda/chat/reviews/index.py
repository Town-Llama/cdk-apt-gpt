import os
from datetime import datetime
import json
import logging
import requests
import openai
from outscraper import ApiClient
import os
import traceback


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("rewviews/index.py")


def lambda_handler(event, context):
    g_api_key = os.getenv('GOOGLE_API_KEY', None)
    if not g_api_key:
        raise Exception("Google API Key Not Found")
    oai_api_key = os.getenv('OPEN_AI_KEY', None)
    if not oai_api_key:
        raise Exception("OpenAI API Key Not Found")
    outscraper_api_key = os.getenv("OUTSCRAPER_API_KEY", None)
    if not outscraper_api_key:
        raise Exception("Outscraper API Key Not Found")
    
    try:
        # Parse the request body
        body = json.loads(event['body'])
        apt = body.get('apt')
        
        address_fields = ['buildingname', 'addresscity', 'addressstate', 'addressstreet', 'addresszipcode']

        if not apt or any([field not in apt for field in address_fields]):
            return {
                'statusCode': 400,
                'headers': {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                    "Access-Control-Allow-Methods": "*"
                },
                'body': json.dumps({'error': 'Apartment Building Required'})
            }

        # building name
        address = ", ".join([apt[field] for field in address_fields[1:]])
        building_name = apt[address_fields[0]]
        if not address.startswith(building_name):
            address = ", ".join([building_name, address])
        place_id = get_place_id(address, g_api_key)
        reviews = get_reviews(place_id, outscraper_api_key, reviews_limit=10)
        if len(reviews) == 0:
            raise Exception("No Reviews Found")
        client = OpenAI(api_key=oai_api_key)
        summary = summarize_reviews(reviews=reviews, client=client)

        # Log the review summary
        logger.info(f"{summary} OK")

        # Return the review summary
        return {
            'statusCode': 201,
            'headers': {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
            },
            'body': json.dumps({'data': summary})
        }
    except Exception as e:
        print(f"ERROR in reviews: {e}")
        traceback.print_exc()

        return {
            'statusCode': 200,
            'headers': {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
            },
            'body': json.dumps({'data': 'Not Enough Information to Summarize Reviews'})
        }

def search_nearby(latitude, longitude, g_api_key, radius=10):
    """
    Searches for nearby real estate agencies within a given radius of a specified latitude and longitude using the Google Places API.

    Parameters:
        latitude (float): The latitude coordinate of the center point.
        longitude (float): The longitude coordinate of the center point.
        g_api_key (str): The API key for accessing the Google Places API.
        radius (int, optional): The radius in meters within which to search for nearby real estate agencies. Defaults to 100.

    Returns:
        dict: A JSON object containing information about the nearby real estate agencies, including their display name, formatted address, and ID. If the API request fails, returns the JSON object containing the error information.
    """
    url = "https://places.googleapis.com/v1/places:searchNearby"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": g_api_key,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.id" 
    }

    payload = {
        # "includedTypes": ["real_estate_agency"], # we're missing some of these, we will want to adjust here
        "maxResultCount": 10,
        "rankPreference": "DISTANCE",
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "radius": radius # meters
            }
        }
    }

    response = requests.post(url, headers=headers, data=json.dumps(payload))

    if response.status_code == 200:
        return response.json() 
    else:
        return response.json()

def get_reviews(place_id, out_key, reviews_limit=10):
    """
    Retrieves reviews for a given place ID using the Outscraper API.

    Args:
        place_id (str): The ID of the place to retrieve reviews for.
        out_key (str): The API key for accessing the Outscraper API.
        reviews_limit (int, optional): The maximum number of reviews to retrieve. Defaults to 10.

    Returns:
        list: A list of dictionaries containing information about the retrieved reviews. Each dictionary contains the following keys:
            - "review_datetime_utc" (str): The UTC timestamp of the review.
            - "review_rating" (int): The rating given by the reviewer.
            - "review_text" (str): The text of the review.
            - "reviewer_name" (str): The name of the reviewer.
            - "reviewer_location" (str): The location of the reviewer.
            - "review_url" (str): The URL of the review.

    Raises:
        IndexError: If no reviews are found for the given place ID.
    """
    api_client = ApiClient(api_key=out_key)
    results = api_client.google_maps_reviews(place_id, reviews_limit=reviews_limit)
    return results[0]['reviews_data']

def summarize_reviews(reviews):
    """
    Summarizes a list of apartment reviews based on a user query.

    Args:
        reviews (list): A list of dictionaries containing information about the reviews. Each dictionary should have the following keys:
            - "review_datetime_utc" (str): The UTC timestamp of the review.
            - "review_rating" (int): The rating given by the reviewer.
            - "review_text" (str): The text of the review.
        query (str): The user query to consider when summarizing the reviews.
        client (OpenAI): An instance of the OpenAI API client.

    Returns:
        str: A summary of the apartment reviews in 50 words. The summary considers both the recency and the rating of the reviews, as well as any mentions of the user query. The summary emphasizes traits that are repeated in the reviews.

    Raises:
        ValueError: If any of the input reviews are missing required keys.
        IndexError: If no reviews are found for the given place ID.
    """
    # Format and combine the reviews
    combined_reviews = format_reviews(reviews)
    
    # Define the prompt for the summarization
    prompt = f"""
        Summarize the following apartment reviews in 50 words. 
        Consider both the recency and the rating provided. 
        Also, if reviews mention anything (positive or negative) 
        related to the user query, then make sure that is also 
        mentioned in response. 
        Emphasize on traits that are repeated in the reviews.  

        Combined reviews:
        {combined_reviews}.
        """

    # Call the OpenAI API
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "system", "content": "You are a helpful assistant."},
                  {"role": "user", "content": f"{prompt}"}],
        temperature=0,
    )

    summary = response.choices[0].message.content
    return summary

def format_reviews(reviews):
    """
    Formats a list of reviews into a string representation.

    Args:
        reviews (list): A list of dictionaries containing information about the reviews. Each dictionary should have the following keys:
            - "review_datetime_utc" (str): The UTC timestamp of the review.
            - "review_rating" (int): The rating given by the reviewer.
            - "review_text" (str): The text of the review.

    Returns:
        str: A string representation of the formatted reviews. Each review is formatted as follows:
            - "Date: <date_str>, Rating: <rating>\n<Review>\n"
        The reviews are sorted by date in descending order and concatenated into a single string.

    Raises:
        ValueError: If any of the input reviews are missing required keys.
    """
    formatted_reviews = []
    for review in reviews:
        date_str = review['review_datetime_utc']
        date = datetime.strptime(date_str, '%m/%d/%Y %H:%M:%S')
        rating = review['review_rating']
        content = review['review_text']
        formatted_review = f"Date: {date_str}, Rating: {rating}\n{content}\n"
        formatted_reviews.append((date, formatted_review))
    # Sort reviews by date (most recent first)
    formatted_reviews.sort(reverse=True, key=lambda x: x[0])
    # Combine the formatted reviews into a single string
    combined_reviews = "\n".join([review[1] for review in formatted_reviews])
    return combined_reviews

def get_place_id(address, g_api_key):
    """
    Retrieves the latitude and longitude coordinates of a given address using the Google Geocoding API.

    Parameters:
        address (str): The address for which to retrieve the coordinates.
        g_api_key (str): The API key for accessing the Google Geocoding API.

    Returns:
        tuple: A tuple containing the latitude and longitude coordinates of the address. If the API request fails, 
               returns (None, None).
    """
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={g_api_key}"

    response = requests.get(url)
    data = response.json()

    if data['status'] == 'OK':
        return data['results'][0]['place_id']
    else:
        return None
    
    
    
if __name__ == "__main__":
    event = {
        "body": json.dumps({
            "apt": {
                "addresscity": "Austin",
                "addressstate": "TX",
                "addressstreet": "1621 E 6th St",
                "addresszipcode": "78702",
                "area": 598,
                "buildingname": "The Arnold",
                "latitude": "30.377040",
                "longitude": "-97.739914",
                "name": ""
            }
        })
    }
    lambda_handler(event, None)
