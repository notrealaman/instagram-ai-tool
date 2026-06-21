import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = "https://graph.facebook.com";

// Subscribe to webhook via Facebook Graph API
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

    const { instagramId, accessToken } = instagramAccount;
    const body = await request.json();
    const { action, callbackUrl, verifyToken } = body;

    if (action === "subscribe") {
      // Subscribe to messages webhook
      const subscribeRes = await fetch(
        `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${instagramId}/subscribed_apps`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscribed_fields: "messages,messaging_postbacks,messaging_seen",
            access_token: accessToken,
          }),
        }
      );
      const subscribeData = await subscribeRes.json();

      console.log("[Webhook] Subscribe response:", subscribeData);

      if (subscribeData.error) {
        return NextResponse.json(
          {
            error: subscribeData.error.message,
            hint: "Make sure your app is in Live mode and has pages_messaging permission approved.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Webhook subscribed successfully",
        data: subscribeData,
      });
    }

    if (action === "unsubscribe") {
      // Unsubscribe from webhook
      const unsubRes = await fetch(
        `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${instagramId}/subscribed_apps`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: accessToken,
          }),
        }
      );
      const unsubData = await unsubRes.json();

      return NextResponse.json({
        success: true,
        message: "Webhook unsubscribed successfully",
        data: unsubData,
      });
    }

    if (action === "check") {
      // Check current subscription status
      const checkRes = await fetch(
        `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${instagramId}?fields=subscribed_apps&access_token=${accessToken}`
      );
      const checkData = await checkRes.json();

      return NextResponse.json({
        success: true,
        data: checkData,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'subscribe', 'unsubscribe', or 'check'." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
