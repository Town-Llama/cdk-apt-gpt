const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const { dbCall } = require('db');
const pgvector = require('pgvector/pg');


exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { 
      max_distance,
      min_rent,
      max_rent,
      coordinates,
      ask,
      bedrooms, 
      image
   } = body;
   console.log(coordinates,
      max_distance,
      min_rent,
      max_rent,
      bedrooms
    );

    // check if the user has enough
    if(!recommendedEnoughPeople(user)){
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify({
          data: false
        }),
      };
    }

    let payload = ask === null ? image : ask;
    const query_embedding = await callEmbeddingModel(payload, ask !== null);
    console.log("query_embedding", query_embedding);
    const query = "SELECT * FROM search_properties_with_embeddings($1, $2, $3, $4, $5, $6, $7);"; // $6 is lease length for now we use default of 12
    const values = [min_rent, max_rent, bedrooms, coordinates.lat, coordinates.lng, max_distance, pgvector.toSql(query_embedding)];
    console.log(pgvector.toSql(query_embedding));
    const responses = await dbCall(query, values);

    console.log(responses, "res");
    const result = filterDuplicateUnits(responses);
    console.log(result, "rest");
    
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        data: result,
      }),
    };
  } catch (error) {
    console.error('Error invoking Lambda function', error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        message: 'Invocation failed!',
        error: error.message,
      }),
    };
  }
};

async function recommendedEnoughPeople(user) {
  const query = "SELECT * FROM check_user_eligibility($1, $2, $3);"; // $6 is lease length for now we use default of 12
  const values = [user, 3, 3]; // setting here the values for waitlist
  const returned =  await dbCall(query, values);
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

const callEmbeddingModel = async (data, isText) => {
  const params = {
    FunctionName: 'Lambda-embedding-model', // The name of the Lambda function to invoke
    InvocationType: 'RequestResponse', // Synchronous invocation
    Payload: JSON.stringify({
      body: JSON.stringify({
        'isText': isText,
        'payload': data
      })
    }), // Pass the event received by this Lambda function to the other Lambda function
  };
  //allow it to take longer than 3 seconds on cold start
  const result = await lambda.invoke(params).promise();
  const a = JSON.parse(result.Payload);
  const b = JSON.parse(a.body);
  return b.embedding;
}
