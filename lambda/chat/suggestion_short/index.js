const { callLLM, buildJsonPromptData } = require('llm');

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        let { rec, formdata } = body;

        let recommendedPlace = rec.buildingname !== null ? rec.buildingname : rec.addressstreet;

        console.log(rec, formdata, "OK");

        let updatedMsgs = [];
        const prompt = "Taking into account the data above, make the case for why " + recommendedPlace + " is the best choice for the user. Give me the best reason only in 1 sentence";
        updatedMsgs = [
            { role: 'system', content: "[Inst]You are helping me pick an apartment. The following is a description of what I want <what_i_want>" + formdata.ask + "</what_i_want>. The user is going to give you some JSON data for each apartment. Read it closely[/Inst]" },
            { role: 'user', content: buildJsonPromptData(rec, formdata) },
            { role: 'system', content: prompt }
        ];

        const response = await callLLM(updatedMsgs);

        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
            body: JSON.stringify({ data: response })
        };
    } catch (e) {
        console.error("ERROR suggestion/short", e);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
            body: JSON.stringify({ data: null })
        };
    }
};