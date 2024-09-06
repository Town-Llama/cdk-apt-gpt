import axios from "axios";
import { Router } from "express";
import routeHelper from "../lib/route_helper";

const router = Router();
export default router;

router.post("/route", async (req, res) => {
  routeHelper(req, res, async () => {
    // Parse the request body
    const body = req.body;
    const { start, end } = body;

    // Validate input
    if (!start || !end) {
      console.log(start, end);
      res.status(400).json({ error: "Start and end coordinates are required" });
      return;
    }

    const data = [];

    // Process each start coordinate
    for (let i = 0; i < start.length; i++) {
      try {
        let startCoords = `${start[i][1]},${start[i][0]}`;
        let endCoords = `${end[1]},${end[0]}`;
        const route = await getDrivingInstructions(startCoords, endCoords);

        data.push({
          startCoords: [start[i][0], start[i][1]], // keep them how they're passed (lat, lng)
          duration: route.duration,
          distance: route.distance,
        });
      } catch (error) {
        console.log(error, "ERROR");
      }
    }

    res.status(200).json({ data });
  });
});

async function getDrivingInstructions(startCoords: string, endCoords: string) {
  const apiBase = "https://api.mapbox.com/directions/v5/mapbox/driving";
  const url = `${apiBase}/${startCoords};${endCoords}?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;

  try {
    const response = await axios.get(url);
    if (
      response.data &&
      response.data.routes &&
      response.data.routes.length > 0
    ) {
      return response.data.routes[0];
    } else {
      throw new Error("No routes found");
    }
  } catch (error) {
    console.error("Error fetching driving instructions:", error);
    throw error;
  }
}
