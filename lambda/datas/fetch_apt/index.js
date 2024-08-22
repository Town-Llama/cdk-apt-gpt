const AWS = require("aws-sdk");
const { dbCall } = require("db");

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { address } = body;
    console.log(address);

    const query = `SELECT u.id AS unit_id, u.property_id, u.property_ts, u.available, u.name, u.baths, u.beds, u.area, u.ts,
               u.rent_12_month_monthly, u.rent_11_month_monthly, u.rent_10_month_monthly, u.rent_9_month_monthly,
               u.rent_8_month_monthly, u.rent_7_month_monthly, u.rent_6_month_monthly, u.rent_5_month_monthly,
               u.rent_4_month_monthly, u.rent_3_month_monthly, u.rent_2_month_monthly, u.rent_1_month_monthly,
               p.timestamp AS property_timestamp, p.addressStreet, p.addressCity, p.addressState, p.addressZipCode,
               p.latitude, p.longitude, p.photosArray, p.description, p.transitScore, p.transitDescription,
               p.walkScore, p.walkDescription, p.buildingName,
               calculate_distance(p.latitude, p.longitude, input_lat, input_lng) AS distance
        FROM Unit u
        JOIN Properties p ON u.property_id = p.id AND u.property_ts = p.timestamp
        WHERE u.property_id == $1`;

    const values = [address];

    responses = await dbCall(query, values);

    console.log(responses, "res");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        data: responses,
      }),
    };
  } catch (error) {
    console.error("Error invoking Lambda function", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Invocation failed!",
        error: error.message,
      }),
    };
  }
};
