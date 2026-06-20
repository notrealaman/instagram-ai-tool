import { NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { z } from "zod";

const generateCaptionSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  tone: z.string().optional(),
  category: z.string().optional(),
  keywords: z.string().optional(),
  includeEmojis: z.boolean().optional(),
  includeCTA: z.boolean().optional(),
  includeHashtags: z.boolean().optional(),
  captionLength: z.enum(["short", "medium", "long"]).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      topic,
      tone,
      category,
      keywords,
      includeEmojis,
      includeCTA,
      includeHashtags,
      captionLength,
    } = generateCaptionSchema.parse(body);

    const lengthGuide = {
      short: "1-2 sentences, under 100 characters",
      medium: "2-3 sentences, 100-200 characters",
      long: "3-4 sentences, 200-300 characters",
    };

    const prompt = `You are an SEO expert and Instagram content strategist. Generate 3 SEO-optimized Instagram captions for the following:

Topic: ${topic}
Tone: ${tone || "Professional"}
Category: ${category || "General"}
${keywords ? `Target keywords: ${keywords}` : ""}
Caption length: ${lengthGuide[captionLength || "medium"]}
${includeEmojis !== false ? "Include relevant emojis" : "No emojis"}
${includeCTA !== false ? "Include a call-to-action" : "No call-to-action"}
${includeHashtags !== false ? "Include 5-7 relevant hashtags" : "No hashtags"}

Requirements:
1. Each caption should be unique in style
2. Optimize for Instagram SEO
3. Use natural language with target keywords
4. Make it engaging and shareable

Respond in this exact JSON format:
{
  "captions": [
    {
      "text": "caption 1 text",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "seoScore": 92
    },
    {
      "text": "caption 2 text",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "seoScore": 87
    },
    {
      "text": "caption 3 text",
      "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
      "seoScore": 85
    }
  ]
}`;

    const response = await generateText(prompt);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to generate captions" },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      captions: result.captions,
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
