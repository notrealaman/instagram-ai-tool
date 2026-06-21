import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access Token is required" },
        { status: 400 }
      );
    }

    const tokenTrimmed = accessToken.trim();

    const debugRes = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${tokenTrimmed}&access_token=${tokenTrimmed}`
    );
    const debugData = await debugRes.json();

    if (debugData.error) {
      return NextResponse.json({
        valid: false,
        error: debugData.error.message,
        step: "Token validation failed",
      });
    }

    const tokenInfo = debugData.data || {};

    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokenTrimmed}`
    );
    const pagesData = await pagesRes.json();

    let pages: Array<{ id: string; name: string; instagram_business_account?: { id: string } }> = [];
    if (pagesData.data) {
      pages = pagesData.data;
    }

    const igAccounts: Array<{ pageId: string; pageName: string; instagramId: string }> = [];

    for (const page of pages) {
      if (page.instagram_business_account) {
        igAccounts.push({
          pageId: page.id,
          pageName: page.name,
          instagramId: page.instagram_business_account.id,
        });
      }
    }

    return NextResponse.json({
      valid: tokenInfo.is_valid || false,
      tokenInfo: {
        appId: tokenInfo.app_id,
        type: tokenInfo.type,
        expiresAt: tokenInfo.expires_at
          ? new Date(tokenInfo.expires_at * 1000).toISOString()
          : "never",
        scopes: tokenInfo.scopes || [],
      },
      pagesFound: pages.length,
      instagramAccounts: igAccounts,
      message: igAccounts.length > 0
        ? `Found ${igAccounts.length} Instagram account(s). Use the Instagram Account ID shown above.`
        : "No Instagram Business accounts found. Make sure your Instagram is set to Business or Creator type and linked to a Facebook Page.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
