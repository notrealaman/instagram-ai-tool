import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

function extractShortcode(input: string): string | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  if (/^[A-Za-z0-9_-]{5,20}$/.test(trimmed)) return trimmed;
  return null;
}

function extractMediaId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{10,}$/.test(trimmed)) return trimmed;
  return null;
}

async function resolveShortcode(shortcode: string, instagramId: string, accessToken: string): Promise<string> {
  // oEmbed with /p/
  try {
    const url = `https://www.instagram.com/p/${shortcode}/`;
    const res = await fetch(`https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`);
    const data = await res.json();
    if (data.media_id) return data.media_id;
  } catch {}

  // oEmbed with /reel/
  try {
    const url = `https://www.instagram.com/reel/${shortcode}/`;
    const res = await fetch(`https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`);
    const data = await res.json();
    if (data.media_id) return data.media_id;
  } catch {}

  // Search user's media
  try {
    let url: string | null = `https://graph.facebook.com/v21.0/${instagramId}/media?fields=id,shortcode&limit=100&access_token=${accessToken}`;
    while (url) {
      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        const match = data.data.find((m: { id: string; shortcode: string }) => m.shortcode === shortcode);
        if (match) return match.id;
      }
      url = data.paging?.next || null;
    }
  } catch {}

  throw new Error(`Could not resolve shortcode "${shortcode}". Try the numeric Post ID instead.`);
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const instagramAccount = await db.instagramAccount.findUnique({ where: { userId: user.userId } });
    if (!instagramAccount) return NextResponse.json({ error: "Instagram account not connected" }, { status: 400 });

    const { instagramId, accessToken } = instagramAccount;
    const body = await request.json();
    const { input } = body;

    if (!input) return NextResponse.json({ error: "Please provide a URL or Post ID" }, { status: 400 });

    // Resolve to media ID
    let mediaId: string;
    const numericId = extractMediaId(input);
    if (numericId) {
      mediaId = numericId;
    } else {
      const shortcode = extractShortcode(input);
      if (!shortcode) return NextResponse.json({ error: `Invalid input: "${input}"` }, { status: 400 });
      mediaId = await resolveShortcode(shortcode, instagramId, accessToken);
    }

    // Fetch media details
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${mediaId}?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count,children{media_type,media_url,thumbnail_url}&access_token=${accessToken}`
    );
    const data = await res.json();

    if (data.error) return NextResponse.json({ error: data.error.message }, { status: 500 });

    // Extract video URL
    let videoUrl = "";
    let thumbnailUrl = "";

    if (data.media_type === "VIDEO") {
      videoUrl = data.media_url;
      thumbnailUrl = data.thumbnail_url || "";
    } else if (data.media_type === "CAROUSEL_ALBUM" && data.children?.data) {
      const videos = data.children.data.filter((c: { media_type: string }) => c.media_type === "VIDEO");
      if (videos.length > 0) {
        videoUrl = videos[0].media_url;
        thumbnailUrl = videos[0].thumbnail_url || "";
      }
    }

    if (!videoUrl) {
      return NextResponse.json({ error: "No video found in this post" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      videoUrl,
      thumbnailUrl,
      caption: data.caption || "",
      permalink: data.permalink || "",
      timestamp: data.timestamp || "",
      mediaType: data.media_type,
      videoCount: data.media_type === "CAROUSEL_ALBUM" ? (data.children?.data?.length || 0) : 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
