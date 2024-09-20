import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { dbCall } from "../lib/db";
import { buildJsonPromptData, callLLM } from "../lib/llm";
import routeHelper from "../lib/route_helper";

const router = Router();
export default router;

router.post("/chats", async (req, res) => {
  await routeHelper(req, res, async () => {
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
  });
});

router.post("/previouschat", async (req, res) => {
  await routeHelper(req, res, async () => {
    // Parse the request body
    const body = req.body;
    const { userid, conversationid } = body;

    if (!userid) {
      console.log(body);
      res.status(400).json({ error: "User ID is required" });
      return;
    }

    // Query the database
    const query =
      "SELECT summary, commuteaddresslat, commuteaddresslng, poicategories, poidata, chatstate, aptidarr FROM chats WHERE userid=$1 and conversationid=$2";
    const values = [userid, conversationid];
    const entries = await dbCall(query, values);

    res.status(200).json({ data: entries });
  });
});

router.post("/chat/next", async (req, res) => {
  await routeHelper(req, res, async () => {
    // Parse the request body
    const body = req.body;
    let { msgs, conversation_id, user_id } = body;

    if (!msgs || !Array.isArray(msgs) || !user_id) {
      res.status(400).json({ error: "Messages and user ID are required" });
      return;
    }

    // Generate a new conversation_id if not provided
    if (!conversation_id) {
      conversation_id = uuidv4();
    }

    // Insert messages into the database
    for (let i = 0; i < msgs.length; i++) {
      try {
        const query =
          "INSERT INTO responses (conversationid, userid, indexNum, response, role) VALUES ($1, $2, $3, $4, $5);";
        const values = [
          conversation_id,
          user_id,
          i,
          msgs[i].content,
          msgs[i].role,
        ];
        await dbCall(query, values);
      } catch (e) {
        console.log("Error inserting message: ", e);
      }
    }

    // Call the language model to get a response
    const response = await callLLM(msgs);

    // Insert the language model's response into the database
    const query =
      "INSERT INTO responses (conversationid, userid, indexNum, response, role) VALUES ($1, $2, $3, $4, $5);";
    const values = [
      conversation_id,
      user_id,
      msgs.length,
      response,
      "assistant",
    ];
    await dbCall(query, values);

    // Return the response
    res.status(201).json({ data: response, conversation_id: conversation_id });
  });
});

router.post("/chat/pois", async (req, res) => {
  await routeHelper(req, res, async () => {
    const body = req.body;
    const { msg } = body;

    const mapboxKeys =
      "auto_repair, restaurant, bar, grocery, fitness_center, park, pharmacy, hospital, education, outdoors, hairdresser, place_of_worship";
    const prompt = `
    The below is a list of mapbox api categories: ${mapboxKeys}. Analyze the user message. Then give me a string array of which of the mapbox apis they want. If none match, return an empty array
    Example 1: msg: "I want restaurants and bars" return: ["restaurant", "bar"]
    Example 2: msg: "I want flamingos" return: ["zoo"]
    Example 3: msg: "who are you?" return: []
    Example 4: msg: "rock shops, breweries, and airshows" return: ["bar"]
    `;

    const response = await callLLM([
      { role: "system", content: prompt },
      { role: "user", content: `msg: ${msg}` },
    ]);

    res.status(201).json({ data: response });
  });
});

// router.post("/chat/suggestion", async (req, res) => {
//   await routeHelper(req, res, async () => {
//     const body = req.body;
//     let { rec, formdata } = body;

//     let recommendedPlace =
//       rec.buildingname !== null ? rec.buildingname : rec.addressstreet;

//     console.log(rec, formdata, "OK");

//     let updatedMsgs = [];
//     const prompt =
//       "Taking into account the data above, make the case for why " +
//       recommendedPlace +
//       " is the best choice for the user. Give the top 5 reasons in bullet points";
//     updatedMsgs = [
//       {
//         role: "system",
//         content:
//           "[Inst]You are helping me pick an apartment. The following is a description of what I want <what_i_want>" +
//           formdata.ask +
//           "</what_i_want>. The user is going to give you some JSON data for each apartment. Read it closely[/Inst]",
//       },
//       { role: "user", content: buildJsonPromptData(rec, formdata) },
//       { role: "system", content: prompt },
//     ];

//     const response = await callLLM(updatedMsgs);

//     res.status(201).json({ data: response });
//   });
// });

// router.post("/chat/suggestion_short", async (req, res) => {
//   await routeHelper(req, res, async () => {
//     const body = req.body;
//     let { rec, formdata } = body;

//     let recommendedPlace =
//       rec.buildingname !== null ? rec.buildingname : rec.addressstreet;

//     console.log(rec, formdata, "OK");

//     let updatedMsgs = [];
//     const prompt =
//       "Taking into account the data above, make the case for why " +
//       recommendedPlace +
//       " is the best choice for the user. Give me the best reason only in 1 sentence";
//     updatedMsgs = [
//       {
//         role: "system",
//         content:
//           "[Inst]You are helping me pick an apartment. The following is a description of what I want <what_i_want>" +
//           formdata.ask +
//           "</what_i_want>. The user is going to give you some JSON data for each apartment. Read it closely[/Inst]",
//       },
//       { role: "user", content: buildJsonPromptData(rec, formdata) },
//       { role: "system", content: prompt },
//     ];

//     const response = await callLLM(updatedMsgs);

//     res.status(201).json({ data: response });
//   });
// });

router.post("/chat/record", async (req, res) => {
  await routeHelper(req, res, async () => {
    // Parse the request body
    const body = req.body;
    const {
      user,
      ask,
      conversationid,
      commuteaddress,
      poiArr,
      poiData,
      chatState,
      aptIdArr,
    } = body;

    if (
      !user ||
      !conversationid ||
      !commuteaddress ||
      !poiArr ||
      !poiData ||
      !chatState ||
      !aptIdArr
    ) {
      res.status(400).json({ error: "Messages and user ID are required" });
      return;
    }

    // Construct the query
    const query = `INSERT INTO chats (userid, summary, conversationid, commuteAddressLat, commuteAddressLng, poiCategories, poiData, chatState, aptIdArr)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                   ON CONFLICT (conversationid)
                   DO UPDATE SET 
                       userid = EXCLUDED.userid,
                       summary = EXCLUDED.summary,
                       commuteAddressLat = EXCLUDED.commuteAddressLat,
                       commuteAddressLng = EXCLUDED.commuteAddressLng,
                       poiCategories = EXCLUDED.poiCategories,
                       poiData = EXCLUDED.poiData,
                       chatState = EXCLUDED.chatState,
                       aptIdArr = EXCLUDED.aptIdArr;`;

    const values = [
      user,
      ask,
      conversationid,
      commuteaddress[0],
      commuteaddress[1],
      poiArr,
      poiData,
      chatState,
      aptIdArr,
    ];

    // Execute the query
    await dbCall(query, values);
    res.status(201).json({ data: true });
  });
});
