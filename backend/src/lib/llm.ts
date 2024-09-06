import Groq from "groq-sdk";

const RETRIES = 3;

export async function callLLM(msgs: any) {
  let attempts = 0;
  while (attempts < RETRIES) {
    try {
      attempts++;
      console.log("Attempt", attempts);
      return callOpenAI(msgs);
      // return callGroq(msgs);
    } catch (e) {
      console.log(e);
      await randomWait();
    }
  }
  throw new Error("Call Failed after retries");
}

export async function callFireworks(msgs: any) {
  try {
    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.FIREWORKS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "accounts/fireworks/models/llama-v3p1-405b-instruct",
        messages: msgs,
      }),
    };
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(
      "https://api.fireworks.ai/inference/v1/chat/completions",
      options
    );
    const data: any = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function callGroq(msgs: any) {
  try {
    const client = new Groq({
      apiKey: process.env["GROQ_API_KEY"], // This is the default and can be omitted
    });
    const chatCompletion = await client.chat.completions.create({
      messages: msgs,
      model: "mixtral-8x7b-32768",
      max_tokens: 1024,
      stream: false,
    });
    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function callOpenAI(messages: any) {
  try {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: process.env.OPEN_AI_KEY,
    });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });

    return (response.choices[0].message.content || "(No Response)").trim();
  } catch (error) {
    console.error("Error calling GPT-4o-Mini:", error);
    throw error;
  }
}

export async function randomWait() {
  let min = 1000;
  let max = 2000;
  let ms = Math.floor(Math.random() * (max - min + 1)) + min;
  console.log("Waiting", ms);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function buildJsonPromptData(data: any, address: any) {
  let prompt = "";
  const columnMapping = {
    price: "Monthly Rent",
    description: "Description from Building Management",
    availabilityCount: "Number of units like this available in building",
    bedrooms: "Bedrooms in Unit",
    distance: "Distance in miles from neighborhood",
    addressstreet: "address",
    buildingname: "Building Name",
    "transit.transit_score": "transportation score out of 100",
    "walkability.walkscore": "walkability score out of 100",
    id: "id",
  };

  const getColumnValue = (obj: any, key: any) => {
    const keys = key.split(".");
    let value = obj;
    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k];
      } else {
        return undefined;
      }
    }
    return value;
  };

  prompt += "{";
  const elements = Object.keys(columnMapping)
    .map((columnName) => {
      const value = getColumnValue(data, columnName);
      if (value !== undefined) {
        const description =
          columnMapping[columnName as keyof typeof columnMapping] || columnName;
        return `"${description}": "${String(value).replace(/"/g, '\\"')}"`;
      }
      return null;
    })
    .filter((element) => element !== null);
  prompt += elements.join(", ");
  prompt += "}, ";

  return prompt.slice(0, -2);
}
