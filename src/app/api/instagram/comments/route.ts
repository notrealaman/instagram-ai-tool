import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

async function getAccessToken(userId: string): Promise<string | null> {
  const account = await db.instagramAccount.findUnique({
    where: { userId },
  });
  return account?.accessToken || null;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getAccessToken(user.userId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Instagram account not connected" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json(
        { error: "Missing mediaId" },
        { status: 400 }
      );
    }

    const url = new URL(
      `https://graph.facebook.com/v25.0/${mediaId}/comments`
    );
    url.searchParams.set(
      "fields",
      "id,text,timestamp,like_count,username,replies{id,text,timestamp,username}"
    );
    url.searchParams.set("access_token", accessToken);

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
      { error: "Failed to fetch comments" },
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

    const accessToken = await getAccessToken(user.userId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Instagram account not connected" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { mediaId, message } = body;

    if (!mediaId || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${mediaId}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          access_token: accessToken,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: data.error.code || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      commentId: data.id,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to post comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = await getAccessToken(user.userId);
    if (!accessToken) {
      return NextResponse.json(
        { error: "Instagram account not connected" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Missing commentId" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/v25.0/${commentId}?access_token=${accessToken}`,
      { method: "DELETE" }
    );

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.message },
        { status: data.error.code || 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
