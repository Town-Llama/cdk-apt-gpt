import AWS from "aws-sdk";
import { Router } from "express";
import routeHelper from "../lib/route_helper";
const ses = new AWS.SES({ region: "us-east-2" }); // Change the region if needed
const YOUR_EMAIL = "seaholmdataco@gmail.com";

const router = Router();
export default router;

router.post("/book", async (req, res) => {
  routeHelper(req, res, async () => {
    const body = req.body;
    const { userid, ask, conversationid, aptId } = body;

    const msg = `${userid} looked for ${ask} with conversationid ${conversationid}. They want unit id: ${aptId}`;

    const params = {
      Destination: {
        ToAddresses: [YOUR_EMAIL], // Replace with your email address
      },
      Message: {
        Body: {
          Text: { Data: msg }, // send the whole last chat
        },
        Subject: { Data: "Lambda Function Triggered" },
      },
      Source: YOUR_EMAIL, // Replace with your verified SES email
    };

    try {
      await ses.sendEmail(params).promise();
      res.status(200).json("Email sent successfully!");
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json(`Error sending email ${error}`);
    }
  });
});
