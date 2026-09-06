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
    const { editionId, label, url, order } = body;

    if (!editionId || !label || !url) {
      return NextResponse.json({ success: false, error: "editionId, label, and url are required" }, { status: 400 });
    }

    const newItem = await prisma.navigationItem.create({
      data: {
        editionId,
        label,
        url,
        order: order || 0,
        isEnabled: true,
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    console.error("POST /api/admin/navigation error:", error);
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
    const { id, label, url, isEnabled, order } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Item ID is required" }, { status: 400 });
    }

    const updated = await prisma.navigationItem.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(url !== undefined && { url }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(order !== undefined && { order }),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("PATCH /api/admin/navigation error:", error);
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

    await prisma.navigationItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/navigation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
