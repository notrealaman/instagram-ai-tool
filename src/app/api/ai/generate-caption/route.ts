import { NextResponse } from "next/server";
import { generateWithNemotron } from "@/lib/nemotron";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
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
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const selectedTone = tone || "Professional";
    const selectedCategory = category || "General";
    const selectedLength = captionLength || "medium";

    const prompt = `Generate 3 Instagram captions as valid JSON. Output ONLY the JSON object.

Topic: ${topic}
Tone: ${selectedTone}
Category: ${selectedCategory}
${keywords ? `Keywords: ${keywords}` : ""}
Length: ${lengthGuide[selectedLength]}
${includeEmojis !== false ? "Use these emojis naturally in text: 🚀 💡 ✨ 🔥 📈 💪 🎯 🌟 ⭐ 💯" : "No emojis in text"}
${includeCTA !== false ? "End each caption with a call-to-action question or statement" : "No CTA"}
${includeHashtags !== false ? "Put hashtags ONLY in the hashtags array, NOT in the text field" : "No hashtags"}

IMPORTANT RULES:
1. The "text" field contains ONLY the caption text, NO hashtags in it
2. The "hashtags" array contains hashtags WITHOUT the # symbol
3. Each hashtag should be ONE word (e.g., "instagramtips" not "instagram tips")
4. Use line breaks (\\n) in text for readability
5. seoScore should be between 70-95

Return this JSON:
{"captions":[{"text":"First line hook\\n\\nSecond part of caption with value","hashtags":["instagramtips","socialmediamarketing","growthhacks","contentcreation","engagement"],"characterCount":120,"seoScore":88,"style":"Emotional"},{"text":"Educational caption\\n\\nWith useful tips for the audience","hashtags":["digitalmarketing","instagramgrowth","socialmediatips","branding","onlinebusiness"],"characterCount":110,"seoScore":85,"style":"Value"},{"text":"Question hook caption\\n\\nAsk audience to engage in comments","hashtags":["marketingtips","instagramgrowth","socialmediastrategy","communitybuilding","contentmarketing"],"characterCount":115,"seoScore":82,"style":"Engagement"}]}`;

    console.log("[Caption Generator] Calling Nemotron API...");

    let response: string;
    try {
      response = await generateWithNemotron(prompt);
    } catch (aiErr) {
      console.error("[Caption Generator] Nemotron API error:", aiErr);
      return NextResponse.json(
        { error: `AI API error: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}` },
        { status: 500 }
      );
    }

    console.log("[Caption Generator] Response length:", response.length);

    // Try multiple JSON extraction strategies
    let captions = null;

    // Strategy 1: Find the last complete JSON object in the response
    const allJsonMatches = response.match(/\{[\s\S]*?\}/g);
    if (allJsonMatches) {
      for (let i = allJsonMatches.length - 1; i >= 0; i--) {
        try {
          const parsed = JSON.parse(allJsonMatches[i]);
          if (parsed.captions && Array.isArray(parsed.captions) && parsed.captions.length > 0) {
            captions = parsed.captions;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    // Strategy 2: Try greedy match for the largest JSON object
    if (!captions) {
      const greedyMatch = response.match(/\{[\s\S]*\}/);
      if (greedyMatch) {
        try {
          const parsed = JSON.parse(greedyMatch[0]);
          if (parsed.captions && Array.isArray(parsed.captions) && parsed.captions.length > 0) {
            captions = parsed.captions;
          }
        } catch {
          // Try to fix common JSON issues
          let fixed = greedyMatch[0]
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]");
          try {
            const parsed = JSON.parse(fixed);
            if (parsed.captions && Array.isArray(parsed.captions) && parsed.captions.length > 0) {
              captions = parsed.captions;
            }
          } catch {
            // continue to next strategy
          }
        }
      }
    }

    // Strategy 3: Look for captions array directly
    if (!captions) {
      const arrayMatch = response.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].text) {
            captions = parsed;
          }
        } catch {
          // continue
        }
      }
    }

    if (!captions) {
      console.error("[Caption Generator] Could not extract captions. Response:", response.substring(0, 1000));
      return NextResponse.json(
        { error: "Failed to generate captions.", raw: response.substring(0, 1000) },
        { status: 500 }
      );
    }

    // Normalize captions - ensure required fields
    captions = captions.map((c: Record<string, unknown>, i: number) => ({
      text: c.text || "",
      hashtags: Array.isArray(c.hashtags) ? c.hashtags : [],
      characterCount: (c.characterCount as number) || ((c.text as string) || "").length,
      seoScore: (c.seoScore as number) || 80,
      style: (c.style as string) || ["Emotional", "Value", "Engagement"][i] || "General",
    }));

    console.log("[Caption Generator] Extracted", captions.length, "captions");

    // Save to database
    try {
      await db.generatedCaption.create({
        data: {
          userId: user.userId,
          topic,
          tone: selectedTone,
          category: selectedCategory,
          keywords: keywords || null,
          captionLength: selectedLength,
          includeEmojis: includeEmojis !== false,
          includeCTA: includeCTA !== false,
          includeHashtags: includeHashtags !== false,
          captions: JSON.stringify(captions),
        },
      });
    } catch (dbError) {
      console.error("Failed to save caption history:", dbError);
    }

    return NextResponse.json({
      captions,
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
