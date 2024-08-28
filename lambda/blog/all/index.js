const { dbCall } = require('db');

exports.handler = async (event) => {
    try {
        // Query the database to check if the user is on the waitlist
        let query = "SELECT id FROM blog";
        let values = [];
        const entries = await dbCall(query, values);

        // Return the response
        return {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
            },
            statusCode: 200,
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
