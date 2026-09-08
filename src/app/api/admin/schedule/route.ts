import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export function parseStartTimeMinutes(timeStr: string): number {
  if (!timeStr) return 9999;
  const match = timeStr.match(/(\d{1,2})[:.](\d{2})\s*(AM|PM)?/i);
  if (!match) return 9999;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm === "PM" && hours < 12) {
    hours += 12;
  } else if (ampm === "AM" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

async function autoSortScheduleItems(editionId: string) {
  const items = await prisma.scheduleItem.findMany({
    where: { editionId },
  });

  items.sort((a, b) => {
    const minA = parseStartTimeMinutes(a.time);
    const minB = parseStartTimeMinutes(b.time);
    if (minA !== minB) return minA - minB;
    return a.order - b.order;
  });

  for (let i = 0; i < items.length; i++) {
    if (items[i].order !== i) {
      await prisma.scheduleItem.update({
        where: { id: items[i].id },
        data: { order: i },
      });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { editionId, time, title, venue, description, tag } = body;

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
        order: 0,
      },
    });

    await autoSortScheduleItems(editionId);

    const updatedItem = await prisma.scheduleItem.findUnique({ where: { id: newItem.id } });

    return NextResponse.json({ success: true, item: updatedItem || newItem });
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

    await autoSortScheduleItems(updated.editionId);

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

    const item = await prisma.scheduleItem.findUnique({ where: { id } });
    if (item) {
      await prisma.scheduleItem.delete({ where: { id } });
      await autoSortScheduleItems(item.editionId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/schedule error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
