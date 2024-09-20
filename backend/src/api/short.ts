import { Router } from "express";
import { buildJsonPromptData, callLLM } from "../lib/llm";

const router = Router();
export default router;

router.post("/short", async (req, res) => {

    try {
        const body = req.body;
        let { rec, formdata } = body;

        let prompt;
        if (Object.keys(rec).includes("isdrink")) {
            prompt = `Taking into the account the data above, make the case for why ${rec.barname}'s drink, ${rec.itemname}, is the best for me. Explain in only 1 sentence`;
        } else {
            prompt = `Taking into the account the data above, make the case for why ${rec.barname} is the best place for me to go. Explain in only 1 sentence`;
        }
        console.log(rec, formdata, "OK", buildJsonPromptData([rec]));

        let updatedMsgs = [];
        updatedMsgs = [
            { role: 'system', content: "[Inst]You are helping me pick a bar to go to in Austin, Texas. The following is a description of what I want <what_i_want>" + formdata + "</what_i_want>. I am giving you some JSON data for each drink and/or bar. Read it closely[/Inst]" },
            { role: 'user', content: buildJsonPromptData([rec]) },
            { role: 'system', content: prompt }
        ];

        const response = await callLLM(updatedMsgs);
        console.log("WHAT???", response);

        return res.status(201).json({ data: response });
    } catch (e) {
        console.error("ERROR suggestion/short", e);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
            },
            body: JSON.stringify({ data: null })
        };
    }
})