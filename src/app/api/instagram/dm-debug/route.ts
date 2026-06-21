import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
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

    const { instagramId, accessToken } = instagramAccount;
    const debug: Record<string, unknown> = {};

    // Test 1: Check token permissions
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`
    );
    const tokenData = await tokenRes.json();
    debug.token = {
      is_valid: tokenData.data?.is_valid,
      scopes: tokenData.data?.scopes,
      expires_at: tokenData.data?.expires_at,
    };

    // Test 2: Get conversations
    const convRes = await fetch(
      `https://graph.facebook.com/v21.0/${instagramId}/conversations?platform=instagram&fields=id,snippet,unread_count,participants,message_count,updated_time&limit=10&access_token=${accessToken}`
    );
    const convData = await convRes.json();
    debug.conversations = convData;

    // Test 3: If we have conversations, get messages from the first one
    if (convData.data && convData.data.length > 0) {
      const firstConv = convData.data[0];
      const msgRes = await fetch(
        `https://graph.facebook.com/v21.0/${firstConv.id}/messages?fields=id,from,message,created_time&limit=5&access_token=${accessToken}`
      );
      const msgData = await msgRes.json();
      debug.firstConversationMessages = msgData;
      debug.firstConversationParticipants = firstConv.participants;
    }

    // Test 4: Try without platform parameter
    const convRes2 = await fetch(
      `https://graph.facebook.com/v21.0/${instagramId}/conversations?fields=id,snippet,unread_count,participants,message_count,updated_time&limit=10&access_token=${accessToken}`
    );
    const convData2 = await convRes2.json();
    debug.conversationsWithoutPlatform = convData2;

    return NextResponse.json(debug);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
