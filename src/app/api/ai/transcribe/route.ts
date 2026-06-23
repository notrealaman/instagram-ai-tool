import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

async function downloadVideo(url: string, accessToken: string): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("text/html")) {
    const newUrl = `${url}${url.includes("?") ? "&" : "?"}access_token=${accessToken}`;
    const retryRes = await fetch(newUrl, { redirect: "follow" });
    if (!retryRes.ok) throw new Error("Failed to download video after retry");

    const retryContentType = retryRes.headers.get("content-type") || "";
    if (retryContentType.includes("text/html")) {
      throw new Error("Instagram returned HTML instead of video. The URL may be expired.");
    }

    const buffer = await retryRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { data: base64, mimeType: retryContentType.split(";")[0].trim() };
  }

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

    const { accessToken } = instagramAccount;
    const body = await request.json();
    const { videoUrl, prompt } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Video URL is required" },
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

    // Download the video with access token
    const video = await downloadVideo(videoUrl, accessToken);

    // Validate MIME type
    if (!video.mimeType.startsWith("video/") && !video.mimeType.startsWith("audio/")) {
      return NextResponse.json(
        { error: `Invalid content type: ${video.mimeType}. Expected a video file.` },
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
      `Please transcribe ALL spoken words in this video audio.
       Return the full transcription with timestamps where possible.
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
      `Based on this video, provide:
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
