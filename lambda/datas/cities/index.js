const NEIGHBORS = require("./neighborhood.json");

exports.handler = async (event) => {
    try {
        const cities = Object.keys(NEIGHBORS);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
            body: JSON.stringify({ data: cities }),
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