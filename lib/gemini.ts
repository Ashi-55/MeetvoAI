import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY");
  }
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel(client: GoogleGenerativeAI) {
  let modelName = process.env.GOOGLE_AI_MODEL ?? "gemini-1.0";
  if (modelName === "gemini-1.5-flash") {
    modelName = "gemini-1.0";
  }
  return client.getGenerativeModel({ model: modelName });
}
