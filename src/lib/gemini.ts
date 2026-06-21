import { GoogleGenerativeAI } from "@google/generative-ai";

const globalApiKey = process.env.GEMINI_API_KEY || "";

export const genAI = globalApiKey ? new GoogleGenerativeAI(globalApiKey) : null;

export const MODEL_NAME = "gemini-2.0-flash-lite";

function getClient(userApiKey?: string | null): GoogleGenerativeAI {
  const key = userApiKey || globalApiKey;
  if (!key) {
    throw new Error(
      "Gemini API key not configured. Please add your API key in Settings."
    );
  }
  return new GoogleGenerativeAI(key);
}

export async function generateText(prompt: string, userApiKey?: string | null): Promise<string> {
  const client = getClient(userApiKey);
  const model = client.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateStructuredContent<T>(
  prompt: string,
  userApiKey?: string | null
): Promise<T> {
  const text = await generateText(prompt, userApiKey);

  const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as T;
}
