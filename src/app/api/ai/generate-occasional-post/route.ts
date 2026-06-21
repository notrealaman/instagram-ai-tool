import { NextResponse } from "next/server";
import { generateWithNemotron } from "@/lib/nemotron";
import { getUserFromRequest } from "@/lib/auth";
import { generateImageUrl } from "@/lib/image-generation";
import { z } from "zod";

const generateOccasionalPostSchema = z.object({
  occasion: z.string().min(1, "Occasion is required"),
  customDetails: z.string().optional(),
  brandName: z.string().optional(),
  audienceType: z.string().optional(),
  postDate: z.string().optional(),
  imageSize: z.enum(["square", "portrait", "landscape", "story"]).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { occasion, customDetails, brandName, audienceType, postDate, imageSize } =
      generateOccasionalPostSchema.parse(body);

    const dateContext = postDate
      ? `This post is scheduled for ${new Date(postDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.`
      : "";

    const prompt = `You are an expert Instagram content creator specializing in occasion-based marketing posts.

Generate an engaging Instagram post for this occasion:
Occasion: ${occasion}
${brandName ? `Brand/Company: ${brandName}` : ""}
${audienceType ? `Target Audience: ${audienceType}` : ""}
${customDetails ? `Additional Details: ${customDetails}` : ""}
${dateContext}

Requirements:
1. Write a festive, engaging caption (2-4 sentences max) that captures the spirit of ${occasion}
2. Include relevant emojis that match the occasion
3. Include 5-7 relevant hashtags (without # symbol)
4. Include a call-to-action that encourages engagement
5. Create a detailed image prompt for AI generation that captures the essence of ${occasion}

The tone should be celebratory, warm, and appropriate for ${occasion}.

Respond in this exact JSON format:
{
  "caption": "your festive caption here with emojis",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "imagePrompt": "detailed visual description for AI image generation that captures the spirit of ${occasion}"
}`;

    console.log("[Occasional Post] Generating for:", occasion);
    const response = await generateWithNemotron(prompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Occasional Post] No JSON in response");
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 500 }
      );
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[Occasional Post] JSON parse error");
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Generate image URL
    const sizeMap = {
      square: { width: 1080, height: 1080 },
      portrait: { width: 1080, height: 1350 },
      landscape: { width: 1080, height: 608 },
      story: { width: 1080, height: 1920 },
    };

    const size = sizeMap[imageSize || "square"];
    const imagePrompt = result.imagePrompt || `${occasion} celebration, festive atmosphere, Instagram post`;

    const imageUrl = generateImageUrl({
      prompt: imagePrompt,
      width: size.width,
      height: size.height,
      model: "flux",
      enhance: true,
    });

    console.log("[Occasional Post] Generated successfully");

    return NextResponse.json({
      caption: result.caption,
      hashtags: result.hashtags,
      imagePrompt: result.imagePrompt,
      imageUrl: imageUrl,
      occasion: occasion,
      postDate: postDate || null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
