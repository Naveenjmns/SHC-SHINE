import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { editionId, time, title, venue, description, tag, order } = body;

    if (!editionId || !time || !title) {
      return NextResponse.json({ success: false, error: "editionId, time, and title are required" }, { status: 400 });
    }

    const newItem = await prisma.scheduleItem.create({
      data: {
        editionId,
        time,
        title,
        venue: venue || null,
        description: description || null,
        tag: tag || null,
        order: order || 0,
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    console.error("POST /api/admin/schedule error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, time, title, venue, description, tag, order } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Schedule item ID is required" }, { status: 400 });
    }

    const updated = await prisma.scheduleItem.update({
      where: { id },
      data: {
        ...(time !== undefined && { time }),
        ...(title !== undefined && { title }),
        ...(venue !== undefined && { venue }),
        ...(description !== undefined && { description }),
        ...(tag !== undefined && { tag }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/schedule error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Item ID is required" }, { status: 400 });
    }

    await prisma.scheduleItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/schedule error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
