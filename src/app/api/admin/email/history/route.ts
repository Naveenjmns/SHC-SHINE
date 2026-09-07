import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const broadcasts = await prisma.emailBroadcast.findMany({
      orderBy: { sentAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, broadcasts });
  } catch (error: any) {
    console.error("GET /api/admin/email/history error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
