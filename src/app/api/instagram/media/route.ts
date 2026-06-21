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
    const mediaId = searchParams.get("mediaId");

    if (!mediaId) {
      return NextResponse.json(
        { error: "Missing mediaId" },
        { status: 400 }
      );
    }

    const url = new URL(
      `https://graph.facebook.com/v25.0/${mediaId}/insights`
    );
    url.searchParams.set(
      "metric",
      "engagement,impressions,reach,views,likes,comments,shares,saved"
    );
    url.searchParams.set("period", "lifetime");
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
      { error: "Failed to fetch media insights" },
      { status: 500 }
    );
  }
}
