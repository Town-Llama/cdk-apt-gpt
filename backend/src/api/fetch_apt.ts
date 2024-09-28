import { Router } from "express";
import { dbCall } from "../lib/db";
import routeHelper from "../lib/route_helper";

const Outscraper = require('outscraper');

let outscraper_client = new Outscraper(process.env.OUTSCRAPER_API_KEY);

const router = Router();
export default router;

router.post("/fetch_apt/:id", async (req, res) => {
  await routeHelper(req, res, async () => {
    const id = req.params.id;

    const barquery = `select name as barname, address, description as bardescription, latitude, longitude from bar where id=$1`;
    const values = [id];

    const menuquery = `select name as itemname, description as itemdescription, price, category from bar_menu_item bmi where barid = $1`;

    const bar = await dbCall(barquery, values);
    const menu = await dbCall(menuquery, values);

    const lookupquery = "select rating, review_text from bar_reviews where barid=$1";
    const value = [id];
    let followup_response = await dbCall(lookupquery, value);
    console.log(followup_response, "FR")
    if (followup_response.length == 0) {
      //look up outscraper
      const barquery = "select name as barname from bar where id=$1";
      const barvalue = [id];
      let bar = await dbCall(barquery, barvalue);

      console.log(bar, "bar");

      const reviews = await outscraper_client.googleMapsReviews([bar[0].barname + ' Austin TX, USA'], 5);
      console.log("REVIEWS", reviews);
      //then save to DB
      for (let j = 0; j < reviews[0].reviews_data.length; j++) {
        let review = reviews[0].reviews_data[j];
        console.log("review", review);
        const insertquery = "INSERT INTO bar_reviews (rating, review_text, review_date, barid) VALUES ($1, $2, $3, $4)";
        const insertvalues = [review.review_rating, review.review_text, review.review_datetime_utc, id];
        await dbCall(insertquery, insertvalues);
        followup_response.push({
          review_text: review.review_text,
          rating: review.rating
        })
      }
    }

    const imagequery = `select image_data, filetype from images where bar_id=$1`;
    const image = await dbCall(imagequery, values);


    return res.status(200).json({ data: { menu, bar, reviews: followup_response, image } });
  });
});
