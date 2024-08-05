const { dbCall } = require('db');
const {callLLM} = require("llm");
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        let { msgs, conversation_id, user_id } = body;

        if (!msgs || !Array.isArray(msgs) || !user_id) {
            return {
                headers: {
                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                  },
                statusCode: 400,
                body: JSON.stringify({ error: 'Messages and user ID are required' }),
            };
        }

        // Generate a new conversation_id if not provided
        if (!conversation_id) {
            conversation_id = uuidv4();
        }

        // Insert messages into the database
        for (let i = 0; i < msgs.length; i++) {
            try {
                const query = "INSERT INTO responses (conversationid, userid, indexNum, response, role) VALUES ($1, $2, $3, $4, $5);";
                const values = [conversation_id, user_id, i, msgs[i].content, msgs[i].role];
                await dbCall(query, values);
            } catch (e) {
                console.log("Error inserting message: ", e);
            }
        }

        // Call the language model to get a response
        const response = await callLLM(msgs);

        // Insert the language model's response into the database
        const query = "INSERT INTO responses (conversationid, userid, indexNum, response, role) VALUES ($1, $2, $3, $4, $5);";
        const values = [conversation_id, user_id, msgs.length, response, "assistant"];
        await dbCall(query, values);

        // Return the response
        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
              },
            body: JSON.stringify({ data: response, conversation_id: conversation_id }),
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
              },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
