const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();
const { dbCall } = require("db");
const pgvector = require("pgvector/pg");

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

async function recommendedEnoughPeople(user) {
  const query = "SELECT * FROM check_user_eligibility($1, $2, $3);"; // $6 is lease length for now we use default of 12
  const values = [user, 3, 3]; // setting here the values for waitlist
  const returned = await dbCall(query, values);
  console.log("returned ", returned);
  return returned;
}

function filterDuplicateUnits(results) {
  const seenUnitIds = new Set();
  const filteredResults = [];

  for (const unit of results) {
    if (!seenUnitIds.has(unit.unit_id)) {
      seenUnitIds.add(unit.unit_id);
      filteredResults.push(unit);
    }
  }

  return filteredResults;
}

const callImageEmbeddingModel = async (data, isText) => {
  const params = {
    FunctionName: "Lambda-image-embedding-model", // The name of the Lambda function to invoke
    InvocationType: "RequestResponse", // Synchronous invocation
    Payload: JSON.stringify({
      body: JSON.stringify({
        isText: isText,
        payload: data,
      }),
    }), // Pass the event received by this Lambda function to the other Lambda function
  };
  //allow it to take longer than 3 seconds on cold start
  const result = await lambda.invoke(params).promise();
  const a = JSON.parse(result.Payload);
  const b = JSON.parse(a.body);
  return b.embedding;
};

const callDescrEmbeddingModel = async (data, isText) => {
  const params = {
    FunctionName: "Lambda-descr-embedding-model", // The name of the Lambda function to invoke
    InvocationType: "RequestResponse", // Synchronous invocation
    Payload: JSON.stringify({
      body: JSON.stringify({
        isText: isText,
        payload: data,
      }),
    }), // Pass the event received by this Lambda function to the other Lambda function
  };
  //allow it to take longer than 3 seconds on cold start
  const result = await lambda.invoke(params).promise();
  const a = JSON.parse(result.Payload);
  const b = JSON.parse(a.body);
  return b.embedding;
};
