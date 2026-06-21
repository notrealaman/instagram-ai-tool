import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
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
  responseStyle: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory, responseStyle } = chatSchema.parse(body);

    const settings = await db.userSettings.findUnique({
      where: { userId: user.userId },
    });

    const styleGuide = {
      friendly: "warm, approachable, and use casual language",
      professional: "polite, formal, and business-appropriate",
      casual: "relaxed, conversational, and laid-back",
      humorous: "witty, fun, and light-hearted while staying helpful",
    };

    const historyContext = conversationHistory
      ?.slice(-5)
      .map((h) => `${h.role === "user" ? "Customer" : "Assistant"}: ${h.content}`)
      .join("\n") || "";

    const prompt = `You are an AI assistant for an Instagram business. Respond to customer DMs professionally and helpfully.

Response style: ${styleGuide[(responseStyle as keyof typeof styleGuide) || "friendly"]}

${historyContext ? `Previous conversation:\n${historyContext}\n` : ""}
Customer message: "${message}"

Guidelines:
1. Keep responses concise (2-3 sentences max)
2. Be helpful and solution-oriented
3. Use appropriate emojis sparingly
4. If you don't know something, offer to connect them with a human
5. Never share internal business information
6. Always be polite and professional

Respond with just the message text, no JSON formatting needed.`;

    const response = await generateText(prompt, settings?.geminiApiKey);

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
