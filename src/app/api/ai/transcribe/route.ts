import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function fetchFreshVideoUrl(postId: string, accessToken: string): Promise<{ url: string; type: string }> {
  const res = await fetch(
    `https://graph.facebook.com/v21.0/${postId}?fields=media_type,media_url,thumbnail_url,children{media_type,media_url}&access_token=${accessToken}`
  );
  const data = await res.json();

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
    throw new Error("No video found in this post");
  }

  return { url: videoUrl, type: mediaType };
}

async function downloadVideo(url: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);

  const contentType = res.headers.get("content-type") || "";
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { data: base64, mimeType: contentType.split(";")[0].trim() };
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
        { error: "Video URL or Post ID is required" },
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

    // Get fresh video URL from Graph API
    let videoUrl = inputUrl;
    if (postId) {
      const fresh = await fetchFreshVideoUrl(postId, accessToken);
      videoUrl = fresh.url;
    }

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Could not get video URL" },
        { status: 400 }
      );
    }

    // Download the video
    const video = await downloadVideo(videoUrl);

    // Validate MIME type
    if (!video.mimeType.startsWith("video/") && !video.mimeType.startsWith("audio/")) {
      return NextResponse.json(
        { error: `Invalid content type: ${video.mimeType}. The URL may be expired. Try using a Post ID instead.` },
        { status: 400 }
      );
    }

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
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
