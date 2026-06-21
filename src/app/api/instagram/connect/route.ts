import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId, accessToken } = await request.json();

    if (!accountId || !accessToken) {
      return NextResponse.json(
        { error: "Account ID and Access Token are required" },
        { status: 400 }
      );
    }

    const tokenTrimmed = accessToken.trim();

    const debugRes = await fetch(
      `https://graph.facebook.com/v21.0/debug_token?input_token=${tokenTrimmed}&access_token=${tokenTrimmed}`
    );
    const debugData = await debugRes.json();

    if (debugData.error) {
      return NextResponse.json(
        {
          error: `Token error: ${debugData.error.message}`,
          hint: "Make sure you're using a valid Instagram Graph API access token, not a Facebook Page token.",
        },
        { status: 400 }
      );
    }

    if (debugData.data && !debugData.data.is_valid) {
      return NextResponse.json(
        {
          error: "Access token is invalid or expired",
          hint: "Generate a new long-lived token from Graph API Explorer.",
        },
        { status: 400 }
      );
    }

    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}?fields=id,username,followers_count,follows_count,media_count,profile_picture_url,biography&access_token=${tokenTrimmed}`
    );

    const profileData = await profileRes.json();

    if (profileData.error) {
      let hint = "";
      if (profileData.error.code === 190) {
        hint = "Access token is invalid. Generate a new token from Graph API Explorer with instagram_basic permission.";
      } else if (profileData.error.code === 100) {
        hint = "Account ID format is wrong. Use the numeric Instagram Business Account ID (e.g., 17841400123456789).";
      }

      return NextResponse.json(
        {
          error: profileData.error.message || "Invalid credentials",
          hint,
          errorCode: profileData.error.code,
        },
        { status: 400 }
      );
    }

    if (!profileData.username) {
      return NextResponse.json(
        {
          error: "Could not fetch Instagram profile",
          hint: "Make sure the Account ID is a Business/Creator account ID, not a Facebook Page ID.",
        },
        { status: 400 }
      );
    }

    await db.instagramAccount.upsert({
      where: { userId: user.userId },
      update: {
        instagramId: accountId,
        username: profileData.username,
        accessToken: tokenTrimmed,
        followers: profileData.followers_count || 0,
        following: profileData.follows_count || 0,
        postsCount: profileData.media_count || 0,
        lastSynced: new Date(),
      },
      create: {
        userId: user.userId,
        instagramId: accountId,
        username: profileData.username,
        accessToken: tokenTrimmed,
        followers: profileData.followers_count || 0,
        following: profileData.follows_count || 0,
        postsCount: profileData.media_count || 0,
        lastSynced: new Date(),
      },
    });

    await db.userSettings.upsert({
      where: { userId: user.userId },
      update: {
        instagramAccountId: accountId,
        instagramAccessToken: tokenTrimmed,
      },
      create: {
        userId: user.userId,
        instagramAccountId: accountId,
        instagramAccessToken: tokenTrimmed,
      },
    });

    return NextResponse.json({
      success: true,
      username: profileData.username,
      followers: profileData.followers_count || 0,
      following: profileData.follows_count || 0,
      postsCount: profileData.media_count || 0,
      profilePicture: profileData.profile_picture_url || "",
      biography: profileData.biography || "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
