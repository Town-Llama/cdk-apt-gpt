const { dbCall } = require('db');

exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const { userid } = body;

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
        const query = "SELECT conversationid, summary FROM chats WHERE userid=$1";
        const values = [userid];
        const entries = await dbCall(query, values);

        // Return the results
        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
            body: JSON.stringify({ data: entries }),
        };
    } catch (error) {
        console.error(error);

        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};