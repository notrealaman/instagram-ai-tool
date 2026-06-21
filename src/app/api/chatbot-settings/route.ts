import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const chatbotSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  botName: z.string().min(1).max(50).optional(),
  personality: z.string().optional(),
  mood: z.string().optional(),
  humorLevel: z.number().min(1).max(10).optional(),
  intelligence: z.number().min(1).max(10).optional(),
  responseLength: z.string().optional(),
  customInstructions: z.string().optional(),
  welcomeMessage: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await db.chatbotSettings.findUnique({
      where: { userId: user.userId },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await db.chatbotSettings.create({
        data: {
          userId: user.userId,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = chatbotSettingsSchema.parse(body);

    let settings = await db.chatbotSettings.findUnique({
      where: { userId: user.userId },
    });

    if (!settings) {
      // Create with provided data
      settings = await db.chatbotSettings.create({
        data: {
          userId: user.userId,
          ...data,
        },
      });
    } else {
      // Update existing settings
      settings = await db.chatbotSettings.update({
        where: { userId: user.userId },
        data,
      });
    }

    return NextResponse.json(settings);
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
