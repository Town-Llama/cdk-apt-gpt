async function getDrivingInstructions(startCoords, endCoords) {
    const apiBase = 'https://api.mapbox.com/directions/v5/mapbox/driving';
    const url = `${apiBase}/${startCoords};${endCoords}?access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;

    try {
        const response = await axios.get(url);
        if (response.data && response.data.routes && response.data.routes.length > 0) {
            return response.data.routes[0];
        } else {
            throw new Error('No routes found');
        }
    } catch (error) {
        console.error('Error fetching driving instructions:', error);
        throw error;
    }
}

exports.handler = async (event) => {
    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        const { start, end } = body;

        // Validate input
        if (!start || !end) {
            console.log(start, end);
            return {
                statusCode: 400,
                headers: {
                    "Content-Type": "application/json",
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                  },
                body: JSON.stringify({ error: 'Start and end coordinates are required' }),
            };
        }

        const data = [];

        // Process each start coordinate
        for (let i = 0; i < start.length; i++) {
            try {
                let startCoords = `${start[i][1]},${start[i][0]}`;
                let endCoords = `${end[1]},${end[0]}`;
                const route = await getDrivingInstructions(startCoords, endCoords);
                
                data.push({
                    startCoords: [start[i][0], start[i][1]], // keep them how they're passed (lat, lng)
                    duration: route.duration,
                    distance: route.distance
                });
            } catch (error) {
                console.log(error, "ERROR");
            }
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
              },
            body: JSON.stringify({ data }),
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
