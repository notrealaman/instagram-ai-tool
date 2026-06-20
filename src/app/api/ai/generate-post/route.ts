import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { z } from "zod";

const generatePostSchema = z.object({
  theme: z.string().min(1, "Theme is required"),
  style: z.string().optional(),
  mood: z.string().optional(),
  customInput: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { theme, style, mood, customInput } = generatePostSchema.parse(body);

    const prompt = `You are an expert Instagram content creator. Generate an engaging Instagram post caption for the following:

Theme: ${theme}
Style: ${style || "Modern"}
Mood: ${mood || "Professional"}
${customInput ? `Additional details: ${customInput}` : ""}

Requirements:
1. Write a captivating caption (2-3 sentences max)
2. Include 5-7 relevant hashtags
3. Include a call-to-action
4. Use appropriate emojis

Respond in this exact JSON format:
{
  "caption": "your caption here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"],
  "imagePrompt": "detailed prompt for AI image generation matching this theme and style"
}`;

    const response = await generateText(prompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      caption: result.caption,
      hashtags: result.hashtags,
      imagePrompt: result.imagePrompt,
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
