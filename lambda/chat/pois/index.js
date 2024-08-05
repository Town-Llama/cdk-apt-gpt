const { callLLM } = require('llm');

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { msg } = body;

        const mapboxKeys = "auto_repair, restaurant, bar, grocery, fitness_center, park, pharmacy, hospital";
        const prompt = `
        The below is a list of mapbox api categories: ${mapboxKeys}. Analyze the user message. Then give me a string array of which of the mapbox apis they want. If none match, return an empty array
        Example 1: msg: "I want restaurants and bars" return: ["restaurant", "bar"]
        Example 2: msg: "I want flamingos" return: ["zoo"]
        Example 3: msg: "who are you?" return: []
        `;

        const response = await callLLM([
            { role: 'system', content: prompt },
            { role: 'user', content: `msg: ${msg}` }
        ]);

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
        console.error("ERROR /pois", e);
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