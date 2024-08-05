const { dbCall } = require('db');

exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const { user, ask, conversationid, commuteaddress, poiArr, poiData, chatState, aptIdArr } = body;

        if (!user || !conversationid || !commuteaddress || !poiArr || !poiData || !chatState || !aptIdArr) {
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
                    "Access-Control-Allow-Methods": "*"
                  },
                body: JSON.stringify({ error: 'All fields are required' }),
            };
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
        
        const values = [user, ask, conversationid, commuteaddress[0], commuteaddress[1], poiArr, poiData, chatState, aptIdArr];
        
        // Execute the query
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
            body: JSON.stringify({ data: true }),
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