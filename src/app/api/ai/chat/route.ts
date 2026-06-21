import { NextResponse } from "next/server";
import { generateWithNemotron } from "@/lib/nemotron";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const chatSchema = z.object({
  message: z.string().min(1, "Message is required"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory } = chatSchema.parse(body);

    // Get chatbot settings
    const chatbotSettings = await db.chatbotSettings.findUnique({
      where: { userId: user.userId },
    });

    // Build personality prompt based on settings
    const personality = chatbotSettings?.personality || "friendly";
    const mood = chatbotSettings?.mood || "professional";
    const humorLevel = chatbotSettings?.humorLevel || 5;
    const intelligence = chatbotSettings?.intelligence || 7;
    const responseLength = chatbotSettings?.responseLength || "medium";
    const botName = chatbotSettings?.botName || "AI Assistant";
    const customInstructions = chatbotSettings?.customInstructions || "";

    const humorGuide = {
      1: "Very serious, no humor",
      2: "Mostly serious with occasional light touches",
      3: "Slightly humorous when appropriate",
      4: "Moderate humor, professional but friendly",
      5: "Balanced humor, knows when to be funny",
      6: "Witty and playful sometimes",
      7: "Quite humorous, enjoys a good joke",
      8: "Very humorous, light-hearted tone",
      9: "Extremely witty and funny",
      10: "Comedy expert, always entertaining",
    };

    const personalityGuide: Record<string, string> = {
      friendly: "warm, approachable, and use casual language. Be like a helpful friend.",
      professional: "polite, formal, and business-appropriate. Maintain boundaries while being helpful.",
      casual: "relaxed, conversational, and laid-back. Talk like you're chatting with a buddy.",
      humorous: "witty, fun, and light-hearted while staying helpful. Make people smile.",
      empathetic: "understanding, caring, and emotionally aware. Show genuine concern.",
      enthusiastic: "excited, energetic, and positive. Spread good vibes!",
      mysterious: "intriguing, thoughtful, and slightly enigmatic. Keep them guessing.",
      expert: "knowledgeable, authoritative, and precise. Be the go-to source.",
    };

    const lengthGuide: Record<string, string> = {
      short: "1-2 sentences, very concise",
      medium: "2-3 sentences, balanced",
      long: "3-4 sentences, detailed and thorough",
    };

    const historyContext = conversationHistory
      ?.slice(-5)
      .map((h) => `${h.role === "user" ? "Customer" : "Bot"}: ${h.content}`)
      .join("\n") || "";

    const prompt = `You are ${botName}, an AI assistant for an Instagram business.

PERSONALITY: ${personalityGuide[personality] || personalityGuide.friendly}
MOOD: ${mood}
HUMOR LEVEL (${humorLevel}/10): ${humorGuide[humorLevel as keyof typeof humorGuide] || humorGuide[5]}
RESPONSE LENGTH: ${lengthGuide[responseLength] || lengthGuide.medium}
${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ""}

${historyContext ? `Previous conversation:\n${historyContext}\n` : ""}
Customer message: "${message}"

Guidelines:
1. Stay in character as ${botName}
2. Match the personality and mood settings
3. Use appropriate emojis (not too many)
4. If you don't know something, offer to connect them with a human
5. Never share internal business information
6. Be helpful while maintaining your character
7. Keep responses ${lengthGuide[responseLength] || "2-3 sentences"}

Respond with just the message text, no JSON formatting needed.`;

    console.log("[Chat] Generating response with personality:", personality);

    const response = await generateWithNemotron(prompt);

    return NextResponse.json({
      response: response.trim(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
