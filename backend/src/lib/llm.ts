import Groq from "groq-sdk";

const RETRIES = 3;

export async function callLLM(msgs: any) {
  let attempts = 0;
  while (attempts < RETRIES) {
    try {
      attempts++;
      console.log("Attempt", attempts);
      return await callOpenAI(msgs);
      // const res = await callGroq(msgs);
      // console.log("HIT", res);
      // return res;
    } catch (e) {
      console.log(e);
      await randomWait();
    }
  }
  throw new Error("Call Failed after retries");
}

export async function callGrok(msgs: any) {
  try {
    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.GROK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: msgs,
      }),
    };
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(
      "https://api.x.ai/v1/chat/completions",
      options
    );
    const data: any = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(error);
    throw error;
  }
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
    console.log("REACHED");
    const chatCompletion = await client.chat.completions.create({
      messages: msgs,
      model: "mixtral-8x7b-32768",
      max_tokens: 1024,
      stream: false,
    });
    console.log("REACHE2D");
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

export const buildJsonPromptData = (arr: Array<Object>) => {

  const translatedData: any = [];
  for (let i = 0; i < arr.length; i++) {
    let data = arr[i];
    console.log("HERE WE GO", data, Object.keys(data).includes("isdrink"));
    translatedData[i] = data;
    if (translatedData[i].price == "-1.00") {
      translatedData[i].price = "Not Given";
    }
  }

  return JSON.stringify(translatedData);
};
