import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function extractShortcode(input: string): string | null {
  const trimmed = input.trim();

  // Instagram URL: /p/ABC123/ or /reel/ABC123/
  const urlMatch = trimmed.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];

  // Bare shortcode (5-20 alphanumeric chars)
  if (/^[A-Za-z0-9_-]{5,20}$/.test(trimmed)) return trimmed;

  return null;
}

function extractMediaId(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{10,}$/.test(trimmed)) return trimmed;
  return null;
}

async function resolveShortcodeToMediaId(
  shortcode: string,
  instagramId: string,
  accessToken: string
): Promise<string> {
  const log = (msg: string) => console.log(`[Transcribe:${shortcode}] ${msg}`);

  // === Method 1: oEmbed with /p/ URL ===
  try {
    const url = `https://www.instagram.com/p/${shortcode}/`;
    const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
    log(`Trying oEmbed POST: ${url}`);
    const res = await fetch(oembedUrl);
    const data = await res.json();
    log(`oEmbed POST status: ${res.status}`);
    log(`oEmbed POST response: ${JSON.stringify(data).substring(0, 300)}`);

    if (data.media_id) {
      log(`SUCCESS via oEmbed POST: media_id=${data.media_id}`);
      return data.media_id;
    }
    if (data.error) {
      log(`oEmbed POST error: ${data.error.code} - ${data.error.message}`);
    }
  } catch (e) {
    log(`oEmbed POST exception: ${e}`);
  }

  // === Method 2: oEmbed with /reel/ URL ===
  try {
    const url = `https://www.instagram.com/reel/${shortcode}/`;
    const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
    log(`Trying oEmbed REEL: ${url}`);
    const res = await fetch(oembedUrl);
    const data = await res.json();
    log(`oEmbed REEL status: ${res.status}`);
    log(`oEmbed REEL response: ${JSON.stringify(data).substring(0, 300)}`);

    if (data.media_id) {
      log(`SUCCESS via oEmbed REEL: media_id=${data.media_id}`);
      return data.media_id;
    }
    if (data.error) {
      log(`oEmbed REEL error: ${data.error.code} - ${data.error.message}`);
    }
  } catch (e) {
    log(`oEmbed REEL exception: ${e}`);
  }

  // === Method 3: Direct Graph API with shortcode as ID ===
  try {
    const apiUrl = `https://graph.facebook.com/v21.0/${shortcode}?fields=id,media_type,media_url&access_token=${accessToken}`;
    log(`Trying direct Graph API: ${shortcode}`);
    const res = await fetch(apiUrl);
    const data = await res.json();
    log(`Direct API status: ${res.status}`);
    log(`Direct API response: ${JSON.stringify(data).substring(0, 300)}`);

    if (data.id) {
      log(`SUCCESS via direct API: id=${data.id}`);
      return data.id;
    }
  } catch (e) {
    log(`Direct API exception: ${e}`);
  }

  // === Method 4: Search user's media with pagination ===
  log("Searching user media for shortcode match...");
  try {
    let url: string | null = `https://graph.facebook.com/v21.0/${instagramId}/media?fields=id,shortcode,media_type&limit=100&access_token=${accessToken}`;
    let page = 1;
    let totalScanned = 0;

    while (url) {
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        log(`Media search error: ${data.error.message}`);
        break;
      }

      const posts = data.data || [];
      totalScanned += posts.length;
      log(`Page ${page}: ${posts.length} posts (total scanned: ${totalScanned})`);

      const match = posts.find((m: { id: string; shortcode: string }) => m.shortcode === shortcode);
      if (match) {
        log(`FOUND in user media: id=${match.id}`);
        return match.id;
      }

      url = data.paging?.next || null;
      page++;
    }

    log(`Not found after scanning ${totalScanned} posts`);
  } catch (e) {
    log(`Media search exception: ${e}`);
  }

  // === Method 5: Try oEmbed with www.instagram.com (no trailing slash) ===
  try {
    const url = `https://www.instagram.com/p/${shortcode}`;
    const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
    log(`Trying oEmbed (no trailing slash): ${url}`);
    const res = await fetch(oembedUrl);
    const data = await res.json();
    log(`oEmbed no-slash response: ${JSON.stringify(data).substring(0, 300)}`);

    if (data.media_id) {
      log(`SUCCESS via oEmbed no-slash: media_id=${data.media_id}`);
      return data.media_id;
    }
  } catch (e) {
    log(`oEmbed no-slash exception: ${e}`);
  }

  throw new Error(
    `Could not resolve shortcode "${shortcode}". ` +
    `Debug info: oEmbed failed (check server logs). ` +
    `This could mean: (1) The post is private, ` +
    `(2) The post doesn't exist, ` +
    `(3) Your access token lacks instagram_basic permission. ` +
    `Try using the numeric Post ID from Graph API Explorer instead.`
  );
}

async function fetchVideoUrl(mediaId: string, accessToken: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${mediaId}?fields=media_type,media_url,thumbnail_url,children{media_type,media_url}&access_token=${accessToken}`
  );
  const data = await res.json();
  console.log("[Transcribe] Media response:", JSON.stringify(data, null, 2).substring(0, 500));

  if (data.error) {
    throw new Error(`Graph API error: ${data.error.message}`);
  }

  if (data.media_type === "VIDEO" && data.media_url) {
    return data.media_url;
  }

  if (data.media_type === "CAROUSEL_ALBUM" && data.children?.data) {
    const videoChild = data.children.data.find(
      (c: { media_type: string }) => c.media_type === "VIDEO"
    );
    if (videoChild?.media_url) return videoChild.media_url;
  }

  throw new Error(
    data.media_type === "IMAGE"
      ? "This post is an image, not a video."
      : "No video found in this post."
  );
}

async function downloadVideo(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url, { redirect: "follow" });
  const contentType = res.headers.get("content-type") || "";
  console.log("[Transcribe] Download:", res.status, contentType.substring(0, 40));

  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status})`);
  if (contentType.includes("text/html")) throw new Error("Got HTML instead of video");

  const buffer = await res.arrayBuffer();
  return {
    data: Buffer.from(buffer).toString("base64"),
    mimeType: contentType.split(";")[0].trim() || "video/mp4",
  };
}

async function transcribeVideo(
  video: { data: string; mimeType: string },
  prompt: string | undefined,
  apiKey: string
) {
  const sizeInMB = (video.data.length * 3) / 4 / (1024 * 1024);
  if (sizeInMB > 20) {
    return NextResponse.json({ error: `Video too large (${sizeInMB.toFixed(1)}MB). Max 20MB.` }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const transcriptionPrompt = prompt ||
    `Transcribe ALL spoken words in this video audio in English only.
     Return the full transcription with timestamps where possible.
     If the video contains non-English speech, translate and transcribe in English.
     If there is no speech, describe any sounds or music you hear.
     Be thorough and capture every word spoken.`;

  const result = await model.generateContent([
    transcriptionPrompt,
    { inlineData: { mimeType: video.mimeType, data: video.data } },
  ]);
  const transcription = (await result.response).text();

  const summaryResult = await model.generateContent([
    `Based on this video, provide in English only:
     1. A brief summary (2-3 sentences)
     2. Key topics/themes mentioned
     3. Sentiment (positive/neutral/negative)`,
    { inlineData: { mimeType: video.mimeType, data: video.data } },
  ]);
  const summary = (await summaryResult.response).text();

  return NextResponse.json({
    success: true,
    transcription,
    summary,
    videoSize: `${sizeInMB.toFixed(1)}MB`,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const instagramAccount = await db.instagramAccount.findUnique({ where: { userId: user.userId } });
    if (!instagramAccount) return NextResponse.json({ error: "Instagram account not connected" }, { status: 400 });

    const { instagramId, accessToken } = instagramAccount;
    const body = await request.json();
    const { videoUrl: inputUrl, prompt, postId } = body;

    console.log("[Transcribe] Input:", { inputUrl: inputUrl?.substring(0, 80), postId: postId?.substring(0, 40) });

    if (!inputUrl && !postId) return NextResponse.json({ error: "Please provide a URL or Post ID" }, { status: 400 });

    const apiKey = GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });

    let mediaId: string;

    if (postId) {
      // Check if it's already a numeric ID
      const numericId = extractMediaId(postId);
      if (numericId) {
        console.log("[Transcribe] Using numeric ID:", numericId);
        mediaId = numericId;
      } else {
        const shortcode = extractShortcode(postId);
        if (!shortcode) return NextResponse.json({ error: `Invalid identifier: "${postId}"` }, { status: 400 });
        console.log("[Transcribe] Resolving shortcode from postId:", shortcode);
        mediaId = await resolveShortcodeToMediaId(shortcode, instagramId, accessToken);
      }
    } else if (inputUrl) {
      // Check if it's already a numeric ID
      const numericId = extractMediaId(inputUrl);
      if (numericId) {
        mediaId = numericId;
      } else {
        // Extract shortcode from URL or bare input
        const shortcode = extractShortcode(inputUrl);
        if (shortcode) {
          console.log("[Transcribe] Resolving shortcode from URL:", shortcode);
          mediaId = await resolveShortcodeToMediaId(shortcode, instagramId, accessToken);
        } else {
          // Direct video URL
          console.log("[Transcribe] Trying as direct video URL");
          const video = await downloadVideo(inputUrl);
          if (!video.mimeType.startsWith("video/") && !video.mimeType.startsWith("audio/")) {
            return NextResponse.json({ error: `Not a video: ${video.mimeType}` }, { status: 400 });
          }
          return await transcribeVideo(video, prompt, apiKey);
        }
      }
    } else {
      return NextResponse.json({ error: "Please provide a URL or Post ID" }, { status: 400 });
    }

    // Fetch and download video
    const videoUrl = await fetchVideoUrl(mediaId, accessToken);
    const video = await downloadVideo(videoUrl);

    if (!video.mimeType.startsWith("video/") && !video.mimeType.startsWith("audio/")) {
      return NextResponse.json({ error: `Not a video: ${video.mimeType}` }, { status: 400 });
    }

    return await transcribeVideo(video, prompt, apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[Transcribe] Fatal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
