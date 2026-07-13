const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: 'd:/EventCreww/EventCreww/backend/.env' });

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY.trim();
  console.log("API Key:", apiKey.substring(0, 10) + "...");
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const fetch = globalThis.fetch;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log("Available models:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching models:", err);
  }
}

checkModels();
