import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveEdition } from "@/lib/eventService";
import { buildSecureErrorResponse } from "@/lib/security";
import { parseRank } from "@/lib/results";

export const dynamic = "force-dynamic";

export interface PodiumTeam {
  rank: 1 | 2 | 3;
  positionTitle: string;
  collegeName: string | null;
  teamName: string | null;
  participants: string[];
  score: number | null;
  result: string;
  award: string | null;
}

export async function GET() {
  try {
    const edition = await getActiveEdition();

    // Fetch events with published results
    const events = await prisma.event.findMany({
      where: edition.id && edition.id !== "default-shine" ? { editionId: edition.id } : {},
      include: {
        registrations: {
          // Only approved entries can appear on the podium
          where: {
            result: { not: null },
            status: "CONFIRMED",
          },
          include: {
            user: {
              select: { name: true, college: true },
            },
            delegation: {
              select: { id: true, collegeName: true, teamName: true },
            },
            delegationMember: {
              select: { id: true, name: true },
            },
          },
          orderBy: { updatedAt: "asc" },
        },
      },
      orderBy: { dateTime: "asc" },
    });

    if (events.length > 0) {
      try {
        const rawPrizes: any = await prisma.$queryRaw`
          SELECT "id", "firstPrize", "secondPrize", "thirdPrize" FROM "events"
        `;
        if (Array.isArray(rawPrizes)) {
          const pMap = new Map(rawPrizes.map((p: any) => [p.id, p]));
          for (const ev of events as any[]) {
            const p: any = pMap.get(ev.id);
            if (p) {
              if (p.firstPrize) (ev as any).firstPrize = p.firstPrize;
              if (p.secondPrize) (ev as any).secondPrize = p.secondPrize;
              if (p.thirdPrize) (ev as any).thirdPrize = p.thirdPrize;
            }
          }
        }
      } catch (_) {}
    }

    return NextResponse.json(
      {
        success: true,
        edition,
        events: events.map((e) => {
          // Awards configured by the admin (per event, else edition defaults); null hides the prize line
          const firstPrize: string | null =
            (e as any).firstPrize || (edition as any)?.defaultFirstPrize || null;
          const secondPrize: string | null =
            (e as any).secondPrize || (edition as any)?.defaultSecondPrize || null;
          const thirdPrize: string | null =
            (e as any).thirdPrize || (edition as any)?.defaultThirdPrize || null;

          // Group teammates who share a placing; a college with entrants at different ranks
          // (e.g. 1st and 3rd in an individual event) keeps both podium entries
          const groups = new Map<string, typeof e.registrations>();

          for (const r of e.registrations) {
            const rank = parseRank(r.result);
            if (!rank) continue;
            const delId = r.delegationId || r.delegation?.id;
            const col = r.delegation?.collegeName || r.user.college || "Independent";
            const groupKey = delId ? `del_${delId}_rank_${rank}` : `col_${col}_rank_${rank}`;

            if (!groups.has(groupKey)) {
              groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(r);
          }

          const teams: PodiumTeam[] = [];
          for (const groupRegs of groups.values()) {
            const primary = groupRegs[0];
            const rank = parseRank(primary.result);
            if (!rank) continue;

            const collegeName = primary.delegation?.collegeName || primary.user.college || null;
            const teamName = primary.delegation?.teamName || null;

            // Collect distinct student names
            const participantNames: string[] = [];
            const seen = new Set<string>();
            for (const gr of groupRegs) {
              const name = gr.delegationMember?.name || gr.user.name;
              if (name && !seen.has(name.trim())) {
                seen.add(name.trim());
                participantNames.push(name.trim());
              }
            }

            const maxScore = groupRegs.reduce<number | null>((max, r) => {
              if (r.score !== null && r.score !== undefined) {
                return max === null ? r.score : Math.max(max, r.score);
              }
              return max;
            }, null);

            const positionTitle =
              rank === 1
                ? "1st Place • Champion"
                : rank === 2
                ? "2nd Place • Runner-Up"
                : "3rd Place • Finalist";

            const award =
              rank === 1
                ? firstPrize
                : rank === 2
                ? secondPrize
                : thirdPrize;

            teams.push({
              rank,
              positionTitle,
              collegeName,
              teamName,
              participants: participantNames,
              score: maxScore,
              result: primary.result || `${rank}`,
              award,
            });
          }

          // Sort by rank 1, 2, 3
          teams.sort((a, b) => a.rank - b.rank);

          const podium = {
            first: teams.find((t) => t.rank === 1) || null,
            second: teams.find((t) => t.rank === 2) || null,
            third: teams.find((t) => t.rank === 3) || null,
          };

          return {
            id: e.id,
            name: e.name,
            category: e.category,
            venue: e.venue,
            awards: {
              first: firstPrize,
              second: secondPrize,
              third: thirdPrize,
            },
            podium,
            teams,
          };
        }),
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
