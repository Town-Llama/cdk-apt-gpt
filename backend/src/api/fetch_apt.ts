import { Router } from "express";
import { dbCall } from "../lib/db";
import routeHelper from "../lib/route_helper";

const router = Router();
export default router;

router.get("/fetch_apt/:address", async (req, res) => {
  await routeHelper(req, res, async () => {
    const address = req.params.address;

    const query = `SELECT u.id AS unit_id, u.property_id, u.property_ts, u.available, u.name, u.baths, u.beds, u.area, u.ts,
             u.rent_12_month_monthly, u.rent_11_month_monthly, u.rent_10_month_monthly, u.rent_9_month_monthly,
             u.rent_8_month_monthly, u.rent_7_month_monthly, u.rent_6_month_monthly, u.rent_5_month_monthly,
             u.rent_4_month_monthly, u.rent_3_month_monthly, u.rent_2_month_monthly, u.rent_1_month_monthly,
             p.timestamp AS property_timestamp, p.addressStreet, p.addressCity, p.addressState, p.addressZipCode,
             p.latitude, p.longitude, p.photosArray, p.description, p.transitScore, p.transitDescription,
             p.walkScore, p.walkDescription, p.buildingName
      FROM Unit u
      JOIN Properties p ON u.property_id = p.id AND u.property_ts = p.timestamp
      WHERE u.property_id = $1::varchar`;

    const values = [address];

    const responses = await dbCall(query, values);

    res.status(200).json({ data: responses });
  });
});
