const { dbCall } = require('db');

exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const { userid, recommendeduser } = body;

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

        // Insert the recommendation if it doesn't already exist
        let query = `
        INSERT INTO recommendations (recommendation_id, userid, recommendeduser, recommendationtime)
        SELECT 
            gen_random_uuid(), 
            $1, 
            $2, 
            NOW()
        WHERE 
            NOT EXISTS (
                SELECT 1 
                FROM recommendations 
                WHERE recommendeduser = $2
            );
        `;
        let values = [userid, recommendeduser];
        
        // Execute the query
        const result = await dbCall(query, values);

        // Check if a row was inserted
        const entryAdded = result.rowCount > 0;

        // Return the response
        return {
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                "Access-Control-Allow-Methods": "*"
            },
            statusCode: 200,
            body: JSON.stringify({ data: entryAdded }),
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
