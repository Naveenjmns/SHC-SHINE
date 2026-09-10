import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveEdition } from "@/lib/eventService";
import { buildSecureErrorResponse } from "@/lib/security";

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

    return NextResponse.json(
      {
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
      },
      {
        headers: {
          "Cache-Control": "public, max-age=10, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: any) {
    const secureError = buildSecureErrorResponse(error, "GET /api/leaderboard", "Failed to load leaderboard.");
    return NextResponse.json({ success: false, error: secureError.message }, { status: 500 });
  }
}
