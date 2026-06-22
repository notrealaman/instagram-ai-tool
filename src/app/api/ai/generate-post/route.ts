import { NextResponse } from "next/server";
import { generateWithNemotron } from "@/lib/nemotron";
import { generateImageWithGemini } from "@/lib/gemini";
import { getUserFromRequest } from "@/lib/auth";
import { z } from "zod";

const generatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  theme: z.string().min(1, "Theme is required"),
  style: z.string().optional(),
  mood: z.string().optional(),
  customInput: z.string().optional(),
  imageSize: z.enum(["square", "portrait", "landscape", "story"]).optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, theme, style, mood, customInput, imageSize } = generatePostSchema.parse(body);

    const prompt = `You are an expert Instagram content creator. Generate an engaging Instagram post for the following:

Title/Topic: ${title}
Theme: ${theme}
Style: ${style || "Modern"}
Mood: ${mood || "Professional"}
${customInput ? `Additional details: ${customInput}` : ""}

Requirements:
1. Write a captivating caption (2-3 sentences max) that directly relates to the title/topic
2. Include 5-7 relevant hashtags (without # symbol)
3. Include a call-to-action
4. Use appropriate emojis naturally
5. Create a detailed image prompt for AI generation that matches the title and theme

Respond in this exact JSON format:
{
  "caption": "your caption here with emojis",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "imagePrompt": "detailed visual description for AI image generation, include specific elements, colors, composition, lighting"
}`;

    console.log("[Post Generator] Calling Llama API...");
    const response = await generateWithNemotron(prompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[Post Generator] No JSON in response");
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 500 }
      );
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      console.error("[Post Generator] JSON parse error");
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const sizeLabels: Record<string, string> = {
      square: "square 1:1 aspect ratio",
      portrait: "portrait 4:5 aspect ratio",
      landscape: "landscape 16:9 aspect ratio",
      story: "vertical 9:16 aspect ratio for stories",
    };

    const sizeLabel = sizeLabels[imageSize || "square"];
    const imagePrompt = `${result.imagePrompt || `${theme} ${style || ""} ${mood || ""} Instagram post, high quality, professional photography`}. Generate as ${sizeLabel} image.`;

    console.log("[Post Generator] Generating image with Gemini...");
    let imageUrl: string;
    try {
      imageUrl = await generateImageWithGemini(imagePrompt);
    } catch (imgErr) {
      console.error("[Post Generator] Gemini image generation failed, falling back to Pollinations:", imgErr);
      const encoded = encodeURIComponent(imagePrompt);
      imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1080&model=flux&nologo=true`;
    }

    console.log("[Post Generator] Generated post with image");

    return NextResponse.json({
      caption: result.caption,
      hashtags: result.hashtags,
      imagePrompt: result.imagePrompt,
      imageUrl: imageUrl,
      imageSize: imageSize || "square",
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
