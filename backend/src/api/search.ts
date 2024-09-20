import axios from "axios";
import { response, Router } from "express";
import pgvector from "pgvector/pg";
import { dbCall } from "../lib/db";

const router = Router();
export default router;

router.post("/search", async (req, res) => {
  try {
    const body = req.body;
    const {
      query,
      max_distance,
      coordinates
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
    const data = [];
    for (let i = 0; i < responses.length; i++) {
      let followup_query
      if (responses[i].item_type === "menu_item") {
        followup_query = "select bmi.name as itemName, bmi.description as itemDescription, price, isdrink, category, b.name as barName, address, b.description as barDescription,latitude, longitude from bar_menu_item bmi inner join bar b on b.id = bmi.barid where bmi.id=$1";
      } else {
        followup_query = "select name as barname, description as bardescription, address, latitude, longitude from bar where id=$1";
      }
      const followup_response = await dbCall(followup_query, [responses[i].id]);
      data.push(followup_response[0]);
    }

    return res.status(200).json({ data: data });
  } catch (error) {
    console.error("Error invoking Lambda function", error);
    return res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

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
