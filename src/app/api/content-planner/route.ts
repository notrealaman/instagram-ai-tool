import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const plans = await db.contentPlan.findMany({
      where: { userId: user.userId },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ success: true, plans });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, caption, imageUrl, scheduledAt, category, hashtags, notes } = body;

    if (!title || !scheduledAt) {
      return NextResponse.json({ error: "Title and scheduled date are required" }, { status: 400 });
    }

    const plan = await db.contentPlan.create({
      data: {
        userId: user.userId,
        title,
        caption: caption || null,
        imageUrl: imageUrl || null,
        scheduledAt: new Date(scheduledAt),
        category: category || null,
        hashtags: hashtags || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { id, title, caption, imageUrl, scheduledAt, status, category, hashtags, notes } = body;

    if (!id) return NextResponse.json({ error: "Plan ID required" }, { status: 400 });

    const existing = await db.contentPlan.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const plan = await db.contentPlan.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(caption !== undefined && { caption }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(scheduledAt !== undefined && { scheduledAt: new Date(scheduledAt) }),
        ...(status !== undefined && { status }),
        ...(category !== undefined && { category }),
        ...(hashtags !== undefined && { hashtags }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Plan ID required" }, { status: 400 });

    const existing = await db.contentPlan.findUnique({ where: { id } });
    if (!existing || existing.userId !== user.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.contentPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
