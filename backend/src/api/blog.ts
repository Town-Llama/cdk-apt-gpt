import { Router } from "express";
import { dbCall } from "../lib/db";
import routeHelper from "../lib/route_helper";

const router = Router();
export default router;

router.get("/blog/all", async (req, res) => {
  await routeHelper(req, res, async () => {
    // Query the database to check if the user is on the waitlist
    let query = "SELECT id FROM blog";
    let values: string[] = [];
    const entries = await dbCall(query, values);

    res.status(200).json({ data: entries });
  });
});

router.get("/blog/posts/:entry", async (req, res) => {
  await routeHelper(req, res, async () => {
    // Parse the request body
    const id = req.params.entry;

    // Query the database to check if the user is on the waitlist
    let query =
      "SELECT title, description, content, keywords, image FROM blog WHERE id = $1";
    let values = [id];
    const entries = await dbCall(query, values);

    res.status(200).json({ data: entries });
  });
});
