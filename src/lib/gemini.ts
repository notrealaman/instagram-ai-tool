import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const MODEL_NAME = "gemini-1.5-flash";

export async function generateText(prompt: string): Promise<string> {
  if (!genAI) {
    throw new Error(
      "Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file."
    );
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export async function generateStructuredContent<T>(
  prompt: string
): Promise<T> {
  const text = await generateText(prompt);

  const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse AI response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as T;
}
