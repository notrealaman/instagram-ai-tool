import OpenAI from "openai";

const globalNvidiaKey = process.env.NVIDIA_API_KEY || "";

export const NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b";

function getNemotron(userApiKey?: string | null): OpenAI {
  const key = userApiKey || globalNvidiaKey;
  if (!key) {
    throw new Error(
      "NVIDIA API key not configured. Please add your API key in Settings."
    );
  }
  return new OpenAI({
    apiKey: key,
    baseURL: "https://integrate.api.nvidia.com/v1",
  });
}

export async function generateWithNemotron(prompt: string, userApiKey?: string | null): Promise<string> {
  const client = getNemotron(userApiKey);
  const response = await client.chat.completions.create({
    model: NEMOTRON_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,
    top_p: 0.95,
  });

  return response.choices[0]?.message?.content || "";
}

export async function generateStructuredWithNemotron<T>(
  prompt: string,
  userApiKey?: string | null
): Promise<T> {
  const text = await generateWithNemotron(prompt, userApiKey);

  const jsonMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Nemotron response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as T;
}
