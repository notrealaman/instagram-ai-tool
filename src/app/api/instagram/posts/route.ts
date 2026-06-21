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

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "25";

    const url = new URL(
      `https://graph.facebook.com/v25.0/${instagramAccount.instagramId}/media`
    );
    url.searchParams.set(
      "fields",
      "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,insights.metric(impressions,reach,engagement,shares,saved)"
    );
    url.searchParams.set("limit", limit);
    url.searchParams.set("access_token", instagramAccount.accessToken);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: data.error.code || 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { imageUrl, caption } = body;

    if (!imageUrl || !caption) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const containerRes = await fetch(
      `https://graph.facebook.com/v25.0/${instagramAccount.instagramId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption,
          access_token: instagramAccount.accessToken,
        }),
      }
    );

    const containerData = await containerRes.json();

    if (containerData.error) {
      return NextResponse.json(
        { error: containerData.error.message },
        { status: containerData.error.code || 500 }
      );
    }

    const publishRes = await fetch(
      `https://graph.facebook.com/v25.0/${instagramAccount.instagramId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: instagramAccount.accessToken,
        }),
      }
    );

    const publishData = await publishRes.json();

    if (publishData.error) {
      return NextResponse.json(
        { error: publishData.error.message },
        { status: publishData.error.code || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      mediaId: publishData.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to publish post" },
      { status: 500 }
    );
  }
}
