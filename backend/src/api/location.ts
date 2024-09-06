import { Router } from "express";
import routeHelper from "../lib/route_helper";

// Add this type definition at the top of the file
type Neighborhood = {
  name: string;
  street: string;
  city: string;
  zip_code: string;
};
type NeighborhoodData = { [city: string]: Neighborhood[] };

import NEIGHBORS_UNTYPED from "../data/neighborhood.json";

const NEIGHBORS: NeighborhoodData = NEIGHBORS_UNTYPED;

const router = Router();
export default router;

router.get("/cities", async (req, res) => {
  routeHelper(req, res, async () => {
    const cities = Object.keys(NEIGHBORS);
    res.status(200).json({ data: cities });
  });
});

router.post("/neighborhoods", async (req, res) => {
  routeHelper(req, res, async () => {
    const body = req.body;
    const city = body.city;
    res.status(200).json({ data: NEIGHBORS[city] });
  });
});
