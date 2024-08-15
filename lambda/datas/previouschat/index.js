const { dbCall } = require('db');

exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const { userid, conversationid } = body;

        if (!userid) {
            console.log(body);
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                  },
                body: JSON.stringify({ error: 'User ID is required' }),
            };
        }

        // Query the database
        const query = "SELECT summary, commuteaddresslat, commuteaddresslng, poicategories, poidata, chatstate, aptidarr FROM chats WHERE userid=$1 and conversationid=$2";
        const values = [userid, conversationid];
        const entries = await dbCall(query, values);

        // Return the results
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
              },
            body: JSON.stringify({ data: entries }),
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