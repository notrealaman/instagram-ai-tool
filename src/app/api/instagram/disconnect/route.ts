import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.instagramAccount.deleteMany({
      where: { userId: user.userId },
    });

    await db.userSettings.upsert({
      where: { userId: user.userId },
      update: {
        instagramAccountId: null,
        instagramAccessToken: null,
      },
      create: {
        userId: user.userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
