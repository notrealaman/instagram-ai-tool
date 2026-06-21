import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { generateWithNemotron } from "@/lib/nemotron";
import {
  getConversations,
  getConversationMessages,
  sendIGMessage,
  isUserMessage,
} from "@/lib/instagram-graph";

interface AutoReplyResult {
  conversationId: string;
  senderName: string;
  message: string;
  reply: string;
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instagramAccount = await db.instagramAccount.findUnique({
      where: { userId: user.userId },
    });
    if (!instagramAccount) {
      return NextResponse.json(
        { error: "Instagram account not connected" },
        { status: 400 }
      );
    }

    const chatbotSettings = await db.chatbotSettings.findUnique({
      where: { userId: user.userId },
    });
    if (!chatbotSettings?.isEnabled) {
      return NextResponse.json(
        { error: "Auto-reply is disabled" },
        { status: 400 }
      );
    }

    const { instagramId, accessToken } = instagramAccount;
    const lastRepliedAt = chatbotSettings.lastRepliedAt;

    // Get conversations
    const conversations = await getConversations(instagramId, accessToken);

    const results: AutoReplyResult[] = [];
    let repliedCount = 0;

    for (const conversation of conversations) {
      try {
        // Get messages in this conversation
        const messages = await getConversationMessages(
          conversation.id,
          accessToken,
          5
        );

        if (!messages || messages.length === 0) {
          console.log(`[AutoReply] No messages in conversation ${conversation.id}`);
          continue;
        }

        // Get the last message in the conversation
        const lastMessage = messages[messages.length - 1];

        // Check if last message is from a user (not the page)
        if (!isUserMessage(lastMessage, instagramId)) {
          console.log(`[AutoReply] Last message in ${conversation.id} is from page, skipping`);
          continue;
        }

        // Check if we already replied to this message
        const msgTime = new Date(lastMessage.created_time);
        if (lastRepliedAt && msgTime <= lastRepliedAt) {
          console.log(`[AutoReply] Already replied to message in ${conversation.id}`);
          continue;
        }

        // Get the user's name from participants
        const sender = conversation.participants?.data?.find(
          (p) => p.id !== instagramId
        );
        const senderName = sender?.name || "Unknown";
        const senderId = sender?.id;

        if (!senderId) {
          console.log(`[AutoReply] No sender ID found in conversation ${conversation.id}`);
          continue;
        }

        // Build conversation history
        const history = messages.map((m) => ({
          role: isUserMessage(m, instagramId)
            ? ("user" as const)
            : ("assistant" as const),
          content: m.message,
        }));

        // Generate AI reply
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

        const historyContext = history
          .map((h) => `${h.role === "user" ? "Customer" : "Bot"}: ${h.content}`)
          .join("\n");

        const prompt = `You are ${botName}, an AI assistant for an Instagram business. A customer just sent you a DM.

PERSONALITY: ${personalityGuide[personality] || personalityGuide.friendly}
MOOD: ${mood}
HUMOR LEVEL (${humorLevel}/10): ${humorGuide[humorLevel] || humorGuide[5]}
RESPONSE LENGTH: ${lengthGuide[responseLength] || lengthGuide.medium}
${customInstructions ? `CUSTOM INSTRUCTIONS: ${customInstructions}` : ""}

Recent conversation:
${historyContext}

Customer's latest message: "${lastMessage.message}"

Respond with just the message text, no JSON formatting needed. Keep it natural and conversational.`;

        console.log(`[AutoReply] Generating reply for ${senderName} in conversation ${conversation.id}...`);

        const reply = await generateWithNemotron(prompt);
        const trimmedReply = reply.trim();

        if (!trimmedReply) {
          console.log(`[AutoReply] Empty reply generated, skipping`);
          continue;
        }

        // Send the reply
        await sendIGMessage(senderId, trimmedReply, accessToken);
        repliedCount++;

        results.push({
          conversationId: conversation.id,
          senderName,
          message: lastMessage.message,
          reply: trimmedReply,
        });

        console.log(`[AutoReply] Replied to ${senderName} (${senderId})`);
      } catch (convError) {
        console.error(`[AutoReply] Error processing conversation ${conversation.id}:`, convError);
        continue;
      }
    }

    // Update lastRepliedAt
    await db.chatbotSettings.update({
      where: { userId: user.userId },
      data: { lastRepliedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      repliedCount,
      results,
      totalConversations: conversations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[AutoReply] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
