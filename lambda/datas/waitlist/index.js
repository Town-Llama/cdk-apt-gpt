const { dbCall } = require('db');

exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const { userid } = body;

        if (!userid) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                    "Access-Control-Allow-Methods": "*"
                  },
                body: JSON.stringify({ error: 'User ID is required' }),
            };
        }

        // Query the database to check if the user is on the waitlist
        let query = "SELECT approved FROM waitlist WHERE userid = $1";
        let values = [userid];
        const entries = await dbCall(query, values);
        const approved = entries.filter(e => e.approved);

        // If the user is not on the waitlist, insert them
        if (entries.length === 0) {

            //check if they're one of the first 100 to use the platform

            query = "INSERT INTO waitlist (userid, approved, time) VALUES ($1, $2, $3);";
            values = [userid, false, new Date()];
            await dbCall(query, values);
        }

        // Return the response
        return {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
              },
            statusCode: 200,
            body: JSON.stringify({ authenticated: approved.length !== 0 }),
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