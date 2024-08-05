const NEIGHBORS = require("./neighborhood.json");

exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const city = body.city;

        console.log(city, NEIGHBORS[city]);

        // Create the response
        const response = {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
            body: JSON.stringify({ data: NEIGHBORS[city] }),
        };

        return response;
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
