import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const captions = await db.generatedCaption.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await db.generatedCaption.count({
      where: { userId: user.userId },
    });

    // Parse the captions JSON for each record
    const formattedCaptions = captions.map((caption) => ({
      ...caption,
      captions: JSON.parse(caption.captions),
    }));

    return NextResponse.json({
      captions: formattedCaptions,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Caption ID is required" },
        { status: 400 }
      );
    }

    // Verify the caption belongs to the user
    const caption = await db.generatedCaption.findUnique({
      where: { id },
    });

    if (!caption || caption.userId !== user.userId) {
      return NextResponse.json(
        { error: "Caption not found" },
        { status: 404 }
      );
    }

    await db.generatedCaption.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
