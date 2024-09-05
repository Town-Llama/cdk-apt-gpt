import { Router } from "express";
import { dbCall } from "../lib/db";

const router = Router();

router.post("/waitlist", async (req, res) => {
  try {
    // Parse the request body
    const body = req.body;
    const { userid } = body;

    if (!userid) {
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Query the database to check if the user is on the waitlist
    let query = "SELECT approved FROM waitlist WHERE userid = $1";
    let values = [userid];
    const entries = await dbCall(query, values);
    let approved = entries.filter((e) => e.approved);
    var isApproved = approved.length !== 0;

    // If the user is not on the waitlist, insert them
    if (entries.length === 0) {
      // Check if they're one of the first 100 to use the platform
      query = "SELECT COUNT(*) AS count FROM waitlist WHERE approved = true";
      const countResult = await dbCall(query, []);
      const count = parseInt(countResult[0].count, 10);

      // Determine if the user should be approved immediately
      isApproved = count <= 0; // Approve if less than 100 users are approved

      query =
        "INSERT INTO waitlist (userid, approved, time) VALUES ($1, $2, $3)";
      values = [userid, isApproved, new Date()];
      await dbCall(query, values);
    }

    // Return the response
    res.status(200).json({ authenticated: isApproved });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `Internal Server Error: ${error}` });
    return;
  }
});

export default router;
