import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.userSettings.findUnique({
      where: { userId: user.userId },
    });

    const instagramAccount = await db.instagramAccount.findUnique({
      where: { userId: user.userId },
    });

    return NextResponse.json({
      defaultTone: settings?.defaultTone || "professional",
      defaultStyle: settings?.defaultStyle || "modern",
      autoPostEnabled: settings?.autoPostEnabled || false,
      postFrequency: settings?.postFrequency || "daily",
      instagramConnected: !!instagramAccount,
      instagramUsername: instagramAccount?.username || "",
      instagramFollowers: instagramAccount?.followers || 0,
      geminiApiKey: settings?.geminiApiKey || "",
      nvidiaApiKey: settings?.nvidiaApiKey || "",
      instagramAccountId: settings?.instagramAccountId || "",
      instagramAccessToken: settings?.instagramAccessToken || "",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    await db.userSettings.upsert({
      where: { userId: user.userId },
      update: {
        defaultTone: body.defaultTone,
        defaultStyle: body.defaultStyle,
        autoPostEnabled: body.autoPostEnabled,
        postFrequency: body.postFrequency,
        geminiApiKey: body.geminiApiKey || null,
        nvidiaApiKey: body.nvidiaApiKey || null,
        instagramAccountId: body.instagramAccountId || null,
        instagramAccessToken: body.instagramAccessToken || null,
      },
      create: {
        userId: user.userId,
        defaultTone: body.defaultTone || "professional",
        defaultStyle: body.defaultStyle || "modern",
        autoPostEnabled: body.autoPostEnabled || false,
        postFrequency: body.postFrequency || "daily",
        geminiApiKey: body.geminiApiKey || null,
        nvidiaApiKey: body.nvidiaApiKey || null,
        instagramAccountId: body.instagramAccountId || null,
        instagramAccessToken: body.instagramAccessToken || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
