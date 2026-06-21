import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { generateImageUrl, getInstagramSizes, getStylePresets } from "@/lib/image-generation";
import { z } from "zod";

const generateImageSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  width: z.number().optional(),
  height: z.number().optional(),
  style: z.string().optional(),
  model: z.enum(["flux", "flux-realism", "flux-anime", "flux-3d", "turbo"]).optional(),
  seed: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, width, height, style, model, seed } = generateImageSchema.parse(body);

    // Get style suffix
    const styles = getStylePresets();
    const selectedStyle = styles.find((s) => s.id === style);
    const styleSuffix = selectedStyle?.suffix || "";

    // Build final prompt
    const finalPrompt = prompt + styleSuffix;

    // Generate image URL
    const imageUrl = generateImageUrl({
      prompt: finalPrompt,
      width: width || 1080,
      height: height || 1080,
      model: model || "flux",
      seed,
      enhance: false, // Already added style suffix
    });

    return NextResponse.json({
      url: imageUrl,
      width: width || 1080,
      height: height || 1080,
      prompt: finalPrompt,
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

// GET endpoint to fetch available options
export async function GET() {
  return NextResponse.json({
    sizes: getInstagramSizes(),
    styles: getStylePresets(),
    models: [
      { id: "flux", name: "FLUX (Standard)", description: "Good balance of quality and speed" },
      { id: "flux-realism", name: "FLUX Realism", description: "Photorealistic images" },
      { id: "flux-anime", name: "FLUX Anime", description: "Anime/illustration style" },
      { id: "flux-3d", name: "FLUX 3D", description: "3D rendered style" },
      { id: "turbo", name: "Turbo", description: "Fastest generation" },
    ],
  });
}
