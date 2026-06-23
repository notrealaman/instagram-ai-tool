import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function extractPostIdentifier(input: string): { type: "id" | "shortcode" | "url"; value: string } | null {
  const trimmed = input.trim();

  // Numeric media ID
  if (/^\d+$/.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  // Instagram URL with shortcode: /p/ABC123/ or /reel/ABC123/
  const urlMatch = trimmed.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (urlMatch) {
    return { type: "shortcode", value: urlMatch[1] };
  }

  // Looks like a URL but didn't match Instagram pattern
  if (trimmed.startsWith("http")) {
    return { type: "url", value: trimmed };
  }

  return null;
}

async function resolveMediaId(
  identifier: { type: "id" | "shortcode" | "url"; value: string },
  instagramId: string,
  accessToken: string
): Promise<string> {
  // Already a numeric ID
  if (identifier.type === "id") {
    return identifier.value;
  }

  // Shortcode from URL or direct shortcode
  if (identifier.type === "shortcode") {
    // Try oEmbed to get numeric media_id
    try {
      const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=https://www.instagram.com/p/${identifier.value}/&access_token=${accessToken}`;
      const oembedRes = await fetch(oembedUrl);
      const oembedData = await oembedRes.json();
      if (oembedData.media_id) {
        return oembedData.media_id;
      }
    } catch (e) {
      console.log("[Transcribe] oEmbed failed for shortcode:", identifier.value, e);
    }

    // Fallback: search user's media for matching shortcode
    try {
      let searchUrl: string | null = `https://graph.facebook.com/v21.0/${instagramId}/media?fields=id,shortcode&limit=100&access_token=${accessToken}`;
      while (searchUrl) {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        if (searchData.data) {
          const match = searchData.data.find(
            (m: { id: string; shortcode: string }) => m.shortcode === identifier.value
          );
          if (match) return match.id;
        }
        searchUrl = searchData.paging?.next || null;
      }
    } catch (e) {
      console.log("[Transcribe] Media search failed:", e);
    }

    throw new Error(`Could not find media ID for shortcode "${identifier.value}". The post may be private or not linked to your account.`);
  }

  // Direct URL — try oEmbed
  if (identifier.type === "url") {
    try {
      const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(identifier.value)}&access_token=${accessToken}`;
      const oembedRes = await fetch(oembedUrl);
      const oembedData = await oembedRes.json();
      if (oembedData.media_id) {
        return oembedData.media_id;
      }
    } catch (e) {
      console.log("[Transcribe] oEmbed failed for URL:", identifier.value, e);
    }

    throw new Error("Could not resolve media from this URL. Try pasting the Post ID or shortcode instead (e.g., the code after /reel/ or /p/ in the URL).");
  }

  throw new Error("Invalid input format");
}

async function fetchFreshVideoUrl(mediaId: string, accessToken: string): Promise<{ url: string; type: string }> {
  console.log("[Transcribe] Fetching video for media ID:", mediaId);

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${mediaId}?fields=id,media_type,media_url,thumbnail_url,children{media_type,media_url}&access_token=${accessToken}`
  );
  const data = await res.json();
  console.log("[Transcribe] Graph API response:", JSON.stringify(data, null, 2));

  if (data.error) {
    throw new Error(`Graph API error: ${data.error.message}`);
  }

  let videoUrl = "";
  let mediaType = data.media_type;

  if (data.media_type === "VIDEO") {
    videoUrl = data.media_url;
  } else if (data.media_type === "CAROUSEL_ALBUM" && data.children?.data) {
    const videoChild = data.children.data.find(
      (c: { media_type: string }) => c.media_type === "VIDEO"
    );
    if (videoChild) {
      videoUrl = videoChild.media_url;
      mediaType = "VIDEO";
    }
  }

  if (!videoUrl) {
    throw new Error(
      data.media_type === "IMAGE"
        ? "This post is an image, not a video. Please select a video post."
        : "No video found in this post."
    );
  }

  return { url: videoUrl, type: mediaType };
}

async function downloadVideo(url: string): Promise<{ data: string; mimeType: string }> {
  console.log("[Transcribe] Downloading video from:", url.substring(0, 100) + "...");

  const res = await fetch(url, { redirect: "follow" });
  console.log("[Transcribe] Download response status:", res.status);
  console.log("[Transcribe] Download content-type:", res.headers.get("content-type"));

  if (!res.ok) {
    throw new Error(`Failed to download video (HTTP ${res.status}). The video URL may have expired.`);
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    throw new Error("Downloaded content is HTML, not a video. The video URL may have expired or be restricted.");
  }

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = contentType.split(";")[0].trim() || "video/mp4";

  console.log("[Transcribe] Downloaded video:", (buffer.byteLength / 1024 / 1024).toFixed(1), "MB,", mimeType);

  return { data: base64, mimeType };
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

    const { instagramId, accessToken } = instagramAccount;
    const body = await request.json();
    const { videoUrl: inputUrl, prompt, postId } = body;

    if (!inputUrl && !postId) {
      return NextResponse.json(
        { error: "Please provide a video URL, Post ID, or Instagram link" },
        { status: 400 }
      );
    }

    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Determine the input and resolve to a media ID
    let resolvedMediaId: string;

    if (postId) {
      // Frontend sent a postId — extract identifier from it
      const identifier = extractPostIdentifier(postId);
      if (!identifier) {
        return NextResponse.json(
          { error: `Invalid post identifier: "${postId}"` },
          { status: 400 }
        );
      }
      resolvedMediaId = await resolveMediaId(identifier, instagramId, accessToken);
    } else if (inputUrl) {
      // Frontend sent a raw video URL — try to resolve it
      const identifier = extractPostIdentifier(inputUrl);
      if (identifier && (identifier.type === "id" || identifier.type === "shortcode")) {
        // It's actually an Instagram post URL or ID, resolve it
        resolvedMediaId = await resolveMediaId(identifier, instagramId, accessToken);
      } else {
        // It's a direct video URL — try to download it directly
        console.log("[Transcribe] Trying direct video URL download");
        const video = await downloadVideo(inputUrl);

        if (!video.mimeType.startsWith("video/") && !video.mimeType.startsWith("audio/")) {
          return NextResponse.json(
            { error: `Invalid content type: ${video.mimeType}. This doesn't appear to be a video file.` },
            { status: 400 }
          );
        }

        return await transcribeVideo(video, prompt, apiKey);
      }
    } else {
      return NextResponse.json(
        { error: "Please provide a video URL, Post ID, or Instagram link" },
        { status: 400 }
      );
    }

    // Fetch fresh video URL from Graph API
    const fresh = await fetchFreshVideoUrl(resolvedMediaId, accessToken);

    // Download the video
    const video = await downloadVideo(fresh.url);

    // Validate MIME type
    if (!video.mimeType.startsWith("video/") && !video.mimeType.startsWith("audio/")) {
      return NextResponse.json(
        { error: `Invalid content type: ${video.mimeType}. The post may not contain a video.` },
        { status: 400 }
      );
    }

    return await transcribeVideo(video, prompt, apiKey);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[Transcribe] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function transcribeVideo(
  video: { data: string; mimeType: string },
  prompt: string | undefined,
  apiKey: string
) {
  // Check file size (Gemini limit ~20MB for inline)
  const sizeInMB = (video.data.length * 3) / 4 / (1024 * 1024);
  if (sizeInMB > 20) {
    return NextResponse.json(
      { error: `Video too large (${sizeInMB.toFixed(1)}MB). Maximum is 20MB.` },
      { status: 400 }
    );
  }

  // Initialize Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const transcriptionPrompt = prompt ||
    `Transcribe ALL spoken words in this video audio in English only.
     Return the full transcription with timestamps where possible.
     If the video contains non-English speech, translate and transcribe in English.
     If there is no speech, describe any sounds or music you hear.
     Format the output clearly with paragraphs for different speakers if multiple.
     Be thorough and capture every word spoken.`;

  const result = await model.generateContent([
    transcriptionPrompt,
    {
      inlineData: {
        mimeType: video.mimeType,
        data: video.data,
      },
    },
  ]);

  const response = await result.response;
  const transcription = response.text();

  // Also get a summary
  const summaryResult = await model.generateContent([
    `Based on this video, provide in English only:
     1. A brief summary (2-3 sentences)
     2. Key topics/themes mentioned
     3. Sentiment (positive/neutral/negative)`,
    {
      inlineData: {
        mimeType: video.mimeType,
        data: video.data,
      },
    },
  ]);

  const summaryResponse = await summaryResult.response;
  const summary = summaryResponse.text();

  return NextResponse.json({
    success: true,
    transcription,
    summary,
    videoSize: `${sizeInMB.toFixed(1)}MB`,
  });
}
