import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = "https://graph.facebook.com";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    let instagramAccount;
    if (userId) {
      instagramAccount = await db.instagramAccount.findUnique({
        where: { userId },
      });
    } else {
      instagramAccount = await db.instagramAccount.findFirst();
    }

    if (!instagramAccount) {
      return NextResponse.json(
        { error: "No Instagram account found in database" },
        { status: 404 }
      );
    }

    const { instagramId, accessToken } = instagramAccount;
    const results: Record<string, unknown> = {};
    let callCount = 0;

    // Call 1: Debug token
    try {
      const tokenRes = await fetch(
        `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/debug_token?input_token=${accessToken}&access_token=${accessToken}`
      );
      const tokenData = await tokenRes.json();
      callCount++;
      results.tokenDebug = {
        success: !tokenData.error,
        data: tokenData.data || tokenData.error,
      };
    } catch (e) {
      results.tokenDebug = { success: false, error: String(e) };
    }

    // Call 2: Get conversations
    try {
      const convRes = await fetch(
        `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${instagramId}/conversations?platform=instagram&fields=id,snippet,unread_count,participants,message_count,updated_time&limit=5&access_token=${accessToken}`
      );
      const convData = await convRes.json();
      callCount++;
      results.conversations = {
        success: !convData.error,
        count: convData.data?.length || 0,
        data: convData.data || convData.error,
      };
    } catch (e) {
      results.conversations = { success: false, error: String(e) };
    }

    // Call 3: Get profile info
    try {
      const profileRes = await fetch(
        `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${instagramId}?fields=id,username,name,followers_count,media_count&access_token=${accessToken}`
      );
      const profileData = await profileRes.json();
      callCount++;
      results.profile = {
        success: !profileData.error,
        data: profileData.data || profileData.error,
      };
    } catch (e) {
      results.profile = { success: false, error: String(e) };
    }

    // Call 4: Get recent media
    try {
      const mediaRes = await fetch(
        `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${instagramId}/media?fields=id,caption,timestamp,like_count,comments_count&limit=3&access_token=${accessToken}`
      );
      const mediaData = await mediaRes.json();
      callCount++;
      results.recentMedia = {
        success: !mediaData.error,
        count: mediaData.data?.length || 0,
        data: mediaData.data || mediaData.error,
      };
    } catch (e) {
      results.recentMedia = { success: false, error: String(e) };
    }

    // Call 5: Get subscriber list
    try {
      const subRes = await fetch(
        `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${instagramId}?fields=subscribed_fields&access_token=${accessToken}`
      );
      const subData = await subRes.json();
      callCount++;
      results.subscription = {
        success: !subData.error,
        data: subData.data || subData.error,
      };
    } catch (e) {
      results.subscription = { success: false, error: String(e) };
    }

    return NextResponse.json({
      success: true,
      instagramId,
      callCount,
      message: `Made ${callCount} Graph API calls. Wait up to 24 hours for "Request advanced access" button to activate.`,
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
