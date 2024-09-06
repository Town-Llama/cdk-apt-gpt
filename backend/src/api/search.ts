import axios from "axios";
import { Router } from "express";
import pgvector from "pgvector/pg";
import { dbCall } from "../lib/db";

const router = Router();
export default router;

router.post("/search", async (req, res) => {
  try {
    const body = req.body;
    const {
      user,
      max_distance,
      min_rent,
      max_rent,
      coordinates,
      ask,
      bedrooms,
      image,
      semantic,
    } = body;
    console.log(coordinates, max_distance, min_rent, max_rent, bedrooms);

    let responses;
    if (image !== null) {
      console.log("image", image);
      console.time("datas.search:EmbeddingGeneration");
      const query_embedding = await callImageEmbeddingModel(image, false);
      console.timeEnd("datas.search:EmbeddingGeneration");
      // console.log("image_query_embedding", query_embedding);
      const query =
        "SELECT * FROM search_properties_with_clip_large_embeddings($1, $2, $3, $4, $5, $6, $7);"; // $6 is lease length for now we use default of 12
      const values = [
        min_rent,
        max_rent,
        bedrooms,
        coordinates.lat,
        coordinates.lng,
        max_distance,
        pgvector.toSql(query_embedding),
      ];
      console.log(pgvector.toSql(query_embedding));
      console.time("datas.search:dbCall");
      responses = await dbCall(query, values);
      console.timeEnd("datas.search:dbCall");
    } else if (semantic !== null && semantic !== "") {
      let saveQuery =
        "INSERT INTO queries (userid, time, query, type) VALUES ($1, NOW(), $2, 'semantic') ON CONFLICT DO NOTHING;";
      let saveValues = [user, semantic];
      await dbCall(saveQuery, saveValues); // as long it saves we don't care
      console.log("semantic", semantic);
      console.time("datas.search:EmbeddingGeneration");
      const query_embedding = await callImageEmbeddingModel(semantic, true);
      console.timeEnd("datas.search:EmbeddingGeneration");
      // console.log("semantic_query_embedding", query_embedding);
      const query =
        "SELECT * FROM search_properties_with_clip_large_embeddings($1, $2, $3, $4, $5, $6, $7);"; // $6 is lease length for now we use default of 12
      const values = [
        min_rent,
        max_rent,
        bedrooms,
        coordinates.lat,
        coordinates.lng,
        max_distance,
        pgvector.toSql(query_embedding),
      ];
      console.log(pgvector.toSql(query_embedding));
      console.time("datas.search:dbCall");
      responses = await dbCall(query, values);
      console.timeEnd("datas.search:dbCall");
    } else {
      //descriptions
      console.log("ask", ask);
      let saveQuery =
        "INSERT INTO queries (userid, time, query, type) VALUES ($1, NOW(), $2, 'description') ON CONFLICT DO NOTHING;";
      let saveValues = [user, ask];
      await dbCall(saveQuery, saveValues); // as long it saves we don't care
      console.time("datas.search:EmbeddingGeneration");
      const query_embedding = await callDescrEmbeddingModel(ask, true);
      console.timeEnd("datas.search:EmbeddingGeneration");
      // console.log("text_query_embedding", query_embedding);
      const query =
        "SELECT * FROM search_properties_with_desc_embeddings($1, $2, $3, $4, $5, $6, $7);"; // $6 is lease length for now we use default of 12
      const values = [
        min_rent,
        max_rent,
        bedrooms,
        coordinates.lat,
        coordinates.lng,
        max_distance,
        pgvector.toSql(query_embedding),
      ];
      console.log(pgvector.toSql(query_embedding));
      console.time("datas.search:dbCall");
      responses = await dbCall(query, values);
      console.timeEnd("datas.search:dbCall");
    }

    console.log(responses, "res");
    const result = filterDuplicateUnits(responses);
    console.log(result, "rest");

    res.status(200).json({ data: result });
  } catch (error) {
    console.error("Error invoking Lambda function", error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
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
      `http://${process.env.LOAD_BALANCER_DNS}/text`,
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
    console.error("Error calling description embedding service:", error);
    throw error;
  }
};
