import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateWithNemotron } from "@/lib/nemotron";
import { sendIGMessage } from "@/lib/instagram-graph";
import crypto from "crypto";

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || "instaai-webhook-verify-2024-secret";
const APP_SECRET = process.env.APP_SECRET || "";

interface WebhookEntry {
  id: string;
  time: number;
  changes: Array<{
    value: {
      sender: { id: string };
      recipient: { id: string };
      message?: {
        mid: string;
        text: string;
        attachments?: Array<{ type: string; payload: { url: string } }>;
      };
      messaging_postback?: {
        mid: string;
        title: string;
        payload: string;
      };
    };
    field: string;
  }>;
}

interface WebhookBody {
  object: string;
  entry: WebhookEntry[];
}

// Verify webhook with Facebook
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  console.log("[Webhook] Verification request:", { mode, token, challenge });

  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("[Webhook] Verification successful");
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return new NextResponse("Verification failed", { status: 403 });
}

// Handle incoming DM notifications
export async function POST(request: Request) {
  let body: WebhookBody;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("OK", { status: 200 });
  }

  // Always return 200 quickly to prevent Facebook retries
  // Process async in background
  processWebhook(body).catch((err) => {
    console.error("[Webhook] Background processing error:", err);
  });

  return new NextResponse("OK", { status: 200 });
}

async function processWebhook(body: WebhookBody) {
  try {
    if (body.object !== "page") return;

    console.log("[Webhook] Received notification:", JSON.stringify(body));

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        const { sender, recipient, message } = change.value;
        if (!message?.text) continue;

        const senderId = sender.id;
        const recipientId = recipient.id;
        const messageText = message.text;

        console.log(`[Webhook] DM from ${senderId} to page ${recipientId}: "${messageText}"`);

        // Find the user who owns this Instagram account
        const instagramAccount = await db.instagramAccount.findUnique({
          where: { instagramId: recipientId },
        });

        if (!instagramAccount) {
          console.log(`[Webhook] No account found for page ${recipientId}`);
          continue;
        }

        // Check if auto-reply is enabled
        const chatbotSettings = await db.chatbotSettings.findUnique({
          where: { userId: instagramAccount.userId },
        });

        if (!chatbotSettings?.isEnabled) {
          console.log(`[Webhook] Auto-reply disabled for user ${instagramAccount.userId}`);
          continue;
        }

        // Build AI prompt - no conversation history needed
        const personality = chatbotSettings.personality || "friendly";
        const mood = chatbotSettings.mood || "professional";
        const humorLevel = chatbotSettings.humorLevel || 5;
        const responseLength = chatbotSettings.responseLength || "medium";
        const botName = chatbotSettings.botName || "AI Assistant";
        const customInstructions = chatbotSettings.customInstructions || "";

        const humorGuide: Record<number, string> = {
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

        const prompt = `You are ${botName}, an AI assistant for an Instagram business. A customer just sent you a DM.

PERSONALITY: ${personalityGuide[personality] || personalityGuide.friendly}
MOOD: ${mood}
HUMOR LEVEL (${humorLevel}/10): ${humorGuide[humorLevel] || humorGuide[5]}
RESPONSE LENGTH: ${lengthGuide[responseLength] || lengthGuide.medium}
${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ""}

Customer's message: "${messageText}"

Respond with just the message text, no JSON formatting needed. Keep it natural and conversational. Max 2-3 sentences.`;

        console.log(`[Webhook] Generating reply for ${senderId}...`);

        const reply = await generateWithNemotron(prompt);
        const trimmedReply = reply.trim();

        if (!trimmedReply) {
          console.log("[Webhook] Empty reply, skipping");
          continue;
        }

        // Send reply back
        await sendIGMessage(senderId, trimmedReply, instagramAccount.accessToken);
        console.log(`[Webhook] Replied to ${senderId}: ${trimmedReply}`);
      }
    }
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
  }
}
