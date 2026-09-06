import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveEdition } from "@/lib/eventService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const edition = await getActiveEdition();

    // Fetch events with published results
    const events = await prisma.event.findMany({
      where: edition.id && edition.id !== "default-shine" ? { editionId: edition.id } : {},
      include: {
        registrations: {
          where: {
            result: { not: null },
          },
          include: {
            user: {
              select: { name: true, college: true },
            },
          },
          orderBy: { updatedAt: "asc" },
        },
      },
      orderBy: { dateTime: "asc" },
    });

    return NextResponse.json({
      success: true,
      edition,
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        venue: e.venue,
        results: e.registrations.map((r) => ({
          id: r.id,
          result: r.result,
          user: {
            name: r.user.name,
            college: r.user.college || "Delegation College",
          },
        })),
      })),
    });
  } catch (error: any) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
