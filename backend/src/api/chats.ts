import { Router } from "express";
import { dbCall } from "../lib/db";

const router = Router();

router.post("/chats", async (req, res) => {
  try {
    // Parse the request body
    const body = req.body;
    const { userid } = body;

    if (!userid) {
      console.log(body);
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Query the database
    const query = "SELECT conversationid, summary FROM chats WHERE userid=$1";
    const values = [userid];
    const entries = await dbCall(query, values);

    // Return the results
    res.status(200).json({ data: entries });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
  }
});

export default router;
