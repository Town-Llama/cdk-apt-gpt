import json
import requests
from openai import OpenAI
from outscraper import ApiClient

def lambda_handler(event, context):
    try:
        g_api_key = os.getenv('GOOGLE_API_KEY')
        oai_api_key = os.getenv('OPEN_AI_KEY')
        outscraper_api_key = os.getenv("OUTSCRAPER_API_KEY")
        client = OpenAI(api_key=oai_api_key)
        # Parse the request body
        body = json.loads(event['body'])
        apt = body.get('apt')

        if not apt or 'longitude' not in apt or 'latitude' not in apt:
            return {
                'statusCode': 400,
                'headers': {
                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
                },
                'body': json.dumps({'error': 'Apartment longitude and latitude are required'})
            }

        lng = float(apt['longitude'])
        lat = float(apt['latitude'])

        apicall = search_nearby(lat, long, g_api_key, radius=10)
        places_nearby = apicall['places']
        place_id = places_nearby[0]['id']
        reviews = get_reviews(place_id, outscraper_api_key, reviews_limit=10)
        summary = summarize_reviews(reviews=reviews, client=client)

        # Log the review summary
        print(f"{summary} OK")

        # Return the review summary
        return {
            'statusCode': 201,
            'body': json.dumps({'data': summary})
        }
    except Exception as e:
        print(f"ERROR in reviews: {e}")

        return {
            'statusCode': 200,
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

def summarize_reviews(reviews, client):
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
    response = client.chat.completions.create(
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
