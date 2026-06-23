import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function extractPostIdentifier(input: string): { type: "id" | "shortcode" | "url"; value: string } | null {
  const trimmed = input.trim();

  if (/^\d+$/.test(trimmed)) {
    return { type: "id", value: trimmed };
  }

  const urlMatch = trimmed.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
  if (urlMatch) {
    return { type: "shortcode", value: urlMatch[1] };
  }

  if (trimmed.startsWith("http")) {
    return { type: "url", value: trimmed };
  }

  // Could be a bare shortcode (alphanumeric, no dots/slashes)
  if (/^[A-Za-z0-9_-]{5,20}$/.test(trimmed)) {
    return { type: "shortcode", value: trimmed };
  }

  return null;
}

async function resolveMediaId(
  identifier: { type: "id" | "shortcode" | "url"; value: string },
  instagramId: string,
  accessToken: string
): Promise<string> {
  if (identifier.type === "id") {
    console.log("[Transcribe] Using numeric ID directly:", identifier.value);
    return identifier.value;
  }

  if (identifier.type === "shortcode") {
    const shortcode = identifier.value;
    console.log("[Transcribe] Resolving shortcode:", shortcode);

    // Method 1: oEmbed with /p/ URL
    try {
      const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(`https://www.instagram.com/p/${shortcode}/`)}&access_token=${accessToken}`;
      console.log("[Transcribe] Trying oEmbed (post):", oembedUrl.substring(0, 120));
      const oembedRes = await fetch(oembedUrl);
      const oembedData = await oembedRes.json();
      console.log("[Transcribe] oEmbed (post) response:", JSON.stringify(oembedData).substring(0, 200));
      if (oembedData.media_id) {
        console.log("[Transcribe] Got media_id from oEmbed (post):", oembedData.media_id);
        return oembedData.media_id;
      }
    } catch (e) {
      console.log("[Transcribe] oEmbed (post) failed:", e);
    }

    // Method 2: oEmbed with /reel/ URL
    try {
      const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(`https://www.instagram.com/reel/${shortcode}/`)}&access_token=${accessToken}`;
      console.log("[Transcribe] Trying oEmbed (reel):", oembedUrl.substring(0, 120));
      const oembedRes = await fetch(oembedUrl);
      const oembedData = await oembedRes.json();
      console.log("[Transcribe] oEmbed (reel) response:", JSON.stringify(oembedData).substring(0, 200));
      if (oembedData.media_id) {
        console.log("[Transcribe] Got media_id from oEmbed (reel):", oembedData.media_id);
        return oembedData.media_id;
      }
    } catch (e) {
      console.log("[Transcribe] oEmbed (reel) failed:", e);
    }

    // Method 3: Search user's media for matching shortcode (with full pagination)
    console.log("[Transcribe] Searching user media for shortcode...");
    try {
      let searchUrl: string | null = `https://graph.facebook.com/v21.0/${instagramId}/media?fields=id,shortcode,media_type&limit=100&access_token=${accessToken}`;
      let pageNum = 1;
      while (searchUrl) {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (searchData.error) {
          console.log("[Transcribe] Media search API error:", searchData.error.message);
          break;
        }

        if (searchData.data) {
          console.log(`[Transcribe] Page ${pageNum}: ${searchData.data.length} posts`);
          const match = searchData.data.find(
            (m: { id: string; shortcode: string }) => m.shortcode === shortcode
          );
          if (match) {
            console.log("[Transcribe] Found matching media:", match.id);
            return match.id;
          }
        }
        searchUrl = searchData.paging?.next || null;
        pageNum++;
      }
      console.log("[Transcribe] Shortcode not found after searching", pageNum, "pages");
    } catch (e) {
      console.log("[Transcribe] Media search failed:", e);
    }

    throw new Error(
      `Could not find post with shortcode "${shortcode}". ` +
      `Make sure the post exists and is linked to your connected Instagram account. ` +
      `You can also try pasting the numeric Post ID instead.`
    );
  }

  // Direct URL
  if (identifier.type === "url") {
    console.log("[Transcribe] Trying oEmbed for direct URL:", identifier.value.substring(0, 80));
    try {
      const oembedUrl = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(identifier.value)}&access_token=${accessToken}`;
      const oembedRes = await fetch(oembedUrl);
      const oembedData = await oembedRes.json();
      console.log("[Transcribe] oEmbed (URL) response:", JSON.stringify(oembedData).substring(0, 200));
      if (oembedData.media_id) {
        return oembedData.media_id;
      }
    } catch (e) {
      console.log("[Transcribe] oEmbed (URL) failed:", e);
    }

    // Try extracting shortcode from URL and resolve
    const urlMatch = identifier.value.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/);
    if (urlMatch) {
      return resolveMediaId({ type: "shortcode", value: urlMatch[1] }, instagramId, accessToken);
    }

    throw new Error(
      "Could not resolve this URL. Try pasting the Post ID or the shortcode from the URL instead."
    );
  }

  throw new Error("Invalid input format");
}

async function fetchFreshVideoUrl(mediaId: string, accessToken: string): Promise<{ url: string; type: string }> {
  console.log("[Transcribe] Fetching video for media ID:", mediaId);

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${mediaId}?fields=id,media_type,media_url,thumbnail_url,children{media_type,media_url}&access_token=${accessToken}`
  );
  const data = await res.json();
  console.log("[Transcribe] Graph API response:", JSON.stringify(data, null, 2).substring(0, 500));

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
  console.log("[Transcribe] Download status:", res.status, "content-type:", res.headers.get("content-type"));

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

  console.log("[Transcribe] Downloaded:", (buffer.byteLength / 1024 / 1024).toFixed(1), "MB,", mimeType);

  return { data: base64, mimeType };
}

async function transcribeVideo(
  video: { data: string; mimeType: string },
  prompt: string | undefined,
  apiKey: string
) {
  const sizeInMB = (video.data.length * 3) / 4 / (1024 * 1024);
  if (sizeInMB > 20) {
    return NextResponse.json(
      { error: `Video too large (${sizeInMB.toFixed(1)}MB). Maximum is 20MB.` },
      { status: 400 }
    );
  }

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

    let resolvedMediaId: string;

    if (postId) {
      const identifier = extractPostIdentifier(postId);
      if (!identifier) {
        return NextResponse.json(
          { error: `Invalid post identifier: "${postId}"` },
          { status: 400 }
        );
      }
      resolvedMediaId = await resolveMediaId(identifier, instagramId, accessToken);
    } else if (inputUrl) {
      const identifier = extractPostIdentifier(inputUrl);
      if (identifier && (identifier.type === "id" || identifier.type === "shortcode")) {
        resolvedMediaId = await resolveMediaId(identifier, instagramId, accessToken);
      } else {
        // Direct video URL
        console.log("[Transcribe] Trying direct video URL");
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

    const fresh = await fetchFreshVideoUrl(resolvedMediaId, accessToken);
    const video = await downloadVideo(fresh.url);

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
