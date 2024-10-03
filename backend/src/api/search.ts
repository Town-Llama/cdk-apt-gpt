import axios from "axios";
import { response, Router } from "express";
import pgvector from "pgvector/pg";
import { dbCall } from "../lib/db";
import { buildJsonPromptData, callLLM } from "../lib/llm";
const Outscraper = require('outscraper');

const router = Router();
let outscraper_client = new Outscraper(process.env.OUTSCRAPER_API_KEY);
export default router;

interface BarItem {
  barid: string;
  itemname?: string;
  itemdescription?: string;
  price?: string;
  isdrink?: boolean;
  category?: string;
  barname: string;
  address: string;
  bardescription: string;
  latitude: string;
  longitude: string;
  reviews: Array<Review>;
  reviewsMessage: string;
};

interface Review {
  rating: number,
  review_text: string,
};

router.post("/search", async (req, res) => {
  try {
    const body = req.body;
    const {
      query,
      max_distance,
      coordinates,
      user
    } = body;

    console.log(query, max_distance, coordinates);

    //call embeddings
    console.time("datas.search:EmbeddingGeneration");
    const embedding = await callDescrEmbeddingModel(query, true);
    console.timeEnd("datas.search:EmbeddingGeneration");

    //call db
    const db_query =
      "SELECT * FROM find_top_bars_and_menu_items($1, $2, $3);"; // $6 is lease length for now we use default of 12
    const values = [
      coordinates.lat,
      coordinates.lng,
      pgvector.toSql(embedding),
    ];

    console.time("datas.search:dbCall");
    const responses = await dbCall(db_query, values);
    console.timeEnd("datas.search:dbCall");

    //bad form but lets us ship faster
    console.time("datas.search:getFullBarData");
    let data: Array<BarItem> = [];
    for (let i = 0; i < responses.length; i++) {
      let followup_query
      if (responses[i].item_type === "menu_item") {
        followup_query = "select b.id as barid, bmi.name as itemName, bmi.description as itemDescription, price, isdrink, category, b.name as barName, address, b.description as barDescription,latitude, longitude from bar_menu_item bmi inner join bar b on b.id = bmi.barid where bmi.id=$1";
      } else {
        followup_query = "select id as barid, name as barname, description as bardescription, address, latitude, longitude from bar where id=$1";
      }
      const followup_response = await dbCall(followup_query, [responses[i].id]);
      data.push(followup_response[0]);
    }
    console.time("datas.search:getFullBarData");

    console.time("datas.search:addReviews");
    await addReviews(data);
    console.timeEnd("datas.search:addReviews");

    console.time("datas.search:saveQuery");
    await saveQuery(query, user);
    console.timeEnd("datas.search:saveQuery");

    return res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error invoking Lambda function", error);
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

async function saveQuery(query: string, userid: string) {

  const db_query =
    `INSERT INTO public.queries (userid, "time", query, "type") VALUES ($1, NOW(), $2, $3);`; // $6 is lease length for now we use default of 12
  const values = [userid, query, "description"];
  await dbCall(db_query, values);
}

async function addReviews(data: Array<BarItem>) {
  return new Promise(async (resolve) => {
    const timeout = setTimeout(() => {
      console.log("Operation timed out after 5 seconds. Returning partial results.");
      resolve(data);
    }, 5000);

    try {
      for (let i = 0; i < data.length; i++) {
        const lookupquery = "select rating, review_text from bar_reviews where barid=$1";
        const value = [data[i].barid];
        let followup_response = await dbCall(lookupquery, value);
        if (followup_response.length == 0) {
          const reviews = await outscraper_client.googleMapsReviews([data[i].barname + ' TX, USA'], 5);
          for (let j = 0; j < reviews[0].reviews_data.length; j++) {
            let review = reviews[0].reviews_data[j];
            const insertquery = "INSERT INTO bar_reviews (rating, review_text, review_date, barid) VALUES ($1, $2, $3, $4)";
            const insertvalues = [review.review_rating, review.review_text, review.review_datetime_utc, data[i].barid];
            await dbCall(insertquery, insertvalues);
            followup_response.push({
              review_text: review.review_text,
              rating: review.rating
            });
          }
        }
        data[i].reviews = followup_response;

        const summaryquery = "select rating, review_text from bar_reivew_summaries where barid=$1";
        let raw_result = await dbCall(summaryquery, value);
        let summary_res = raw_result[0];
        if (raw_result.length == 0 && followup_response.length > 0) {
          const response = await callLLM([
            { role: "system", content: "Read the below reviews and summarize the key findings. Point out if anything seems important or unreasonable." },
            { role: "user", content: formatReviews(followup_response) },
          ]);

          let average_rating = 0;
          let ratings = 0;
          for (let i = 0; i < followup_response.length; i++) {
            let rating = parseFloat(followup_response[i].rating);
            if (!Number.isNaN(rating)) {
              average_rating += rating;
              ratings++;
            }
          }
          if (ratings > 0) {
            average_rating /= ratings;
            const insertquery = "INSERT INTO bar_reivew_summaries (rating, review_text, review_date, barid) VALUES ($1, $2, $3, $4)";
            const insertvalues = [average_rating, response, new Date(), data[i].barid];
            await dbCall(insertquery, insertvalues);
          }
          summary_res = response;
        }
        data[i].reviewsMessage = summary_res;
      }

      clearTimeout(timeout);
      resolve(data);
    } catch (error) {
      console.error("An error occurred:", error);
      clearTimeout(timeout);
      resolve(data);
    }
  });
}

function formatReviews(reviews: Array<Review>) {
  let prompt = "";
  for (let i = 0; i < reviews.length; i++) {
    prompt += "Review " + (i + 1) + ": " + reviews[i].review_text;
  }
  return prompt;
}

async function recommendedEnoughPeople(user: string) {
  const query = "SELECT * FROM check_user_eligibility($1, $2, $3);"; // $6 is lease length for now we use default of 12
  const values = [user, 3, 3]; // setting here the values for waitlist
  const returned = await dbCall(query, values);
  console.log("returned ", returned);
  return returned;
}

function filterDuplicateUnits(results: any[]) {
  const seenUnitIds = new Set();
  const filteredResults = [];

  for (const unit of results) {
    if (!seenUnitIds.has(unit.unit_id)) {
      seenUnitIds.add(unit.unit_id);
      filteredResults.push(unit);
    }
  }

  return filteredResults;
}

const callImageEmbeddingModel = async (data: any, isText: boolean) => {
  try {
    const response = await axios.post(
      `http://${process.env.LOAD_BALANCER_DNS}/image`,
      {
        isText: isText,
        payload: data,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.embedding;
  } catch (error) {
    console.error("Error calling image embedding service:", error);
    throw error;
  }
};

const callDescrEmbeddingModel = async (data: any, isText: boolean) => {
  try {
    const response = await axios.post(
      // 'http://localhost:80/text',
      `http://${process.env.LOAD_BALANCER_DNS}/text`,
      {
        payload: data,    // Ensure the key matches the expected key in Flask
        load_model: false // Optional: Include this if you want to handle model loading conditionally
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.embedding;
  } catch (error) {
    console.error("Error calling description embedding service:", error);
    throw error;
  }
};
