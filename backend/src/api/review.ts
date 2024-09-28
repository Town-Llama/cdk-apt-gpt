import { Router } from "express";
import { dbCall } from "../lib/db";
import routeHelper from "../lib/route_helper";
const Outscraper = require('outscraper');

let outscraper_client = new Outscraper(process.env.OUTSCRAPER_API_KEY);
const router = Router();
export default router;

router.post("/review/:id", async (req, res) => {
    await routeHelper(req, res, async () => {
        const id = req.params.id;

        const lookupquery = "select rating, review_text from bar_reviews where barid=$1";
        const value = [id];
        let followup_response = await dbCall(lookupquery, value);
        if (followup_response.length == 0) {
            //look up outscraper
            const barquery = "select name as barname from bar where id=$1";
            const barvalue = [id];
            let bar = await dbCall(barquery, barvalue);

            const reviews = await outscraper_client.googleMapsReviews([bar[0].barname + ' TX, USA'], 5);
            //then save to DB
            for (let j = 0; j < reviews[0].reviews_data.length; j++) {
                let review = reviews[0].reviews_data[j];
                const insertquery = "INSERT INTO bar_reviews (rating, review_text, review_date, barid) VALUES ($1, $2, $3, $4)";
                const insertvalues = [review.review_rating, review.review_text, review.review_datetime_utc, id];
                await dbCall(insertquery, insertvalues);
                followup_response.push({
                    review_text: review.review_text,
                    rating: review.rating
                })
            }
        }

        return res.status(200).json({ data: followup_response });
    });
});
