import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveEdition } from "@/lib/eventService";
import { buildSecureErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

function parseRank(resultStr: string | null | undefined): 1 | 2 | 3 | null {
  if (!resultStr) return null;
  const lower = resultStr.toLowerCase().trim();
  if (
    lower.includes("1st") ||
    lower.includes("first") ||
    lower.includes("gold") ||
    lower.includes("champion") ||
    lower === "1"
  ) {
    return 1;
  }
  if (
    lower.includes("2nd") ||
    lower.includes("second") ||
    lower.includes("silver") ||
    lower.includes("runner") ||
    lower === "2"
  ) {
    return 2;
  }
  if (
    lower.includes("3rd") ||
    lower.includes("third") ||
    lower.includes("bronze") ||
    lower.includes("finalist") ||
    lower === "3"
  ) {
    return 3;
  }
  return null;
}

export interface PodiumTeam {
  rank: 1 | 2 | 3;
  positionTitle: string;
  collegeName: string;
  teamName: string | null;
  participants: string[];
  score: number | null;
  result: string;
  award: string;
}

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
          // Dynamic awards configured by the admin (per event or edition defaults)
          const firstPrize =
            (e as any).firstPrize ||
            (edition as any)?.defaultFirstPrize ||
            "Cash Prize + Trophy + Certificate";
          const secondPrize =
            (e as any).secondPrize ||
            (edition as any)?.defaultSecondPrize ||
            "Cash Prize + Merit Certificate";
          const thirdPrize =
            (e as any).thirdPrize ||
            (edition as any)?.defaultThirdPrize ||
            "Distinction Certificate";

          // Group registrations by team/delegation to avoid multiple entries for teammates
          const groups = new Map<string, typeof e.registrations>();

          for (const r of e.registrations) {
            if (!r.result) continue;
            const rank = parseRank(r.result);
            const delId = r.delegationId || r.delegation?.id;
            const col = r.delegation?.collegeName || r.user.college || "Independent";
            const groupKey = delId ? `del_${delId}` : `col_${col}_rank_${rank || r.result}`;

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

            const collegeName =
              primary.delegation?.collegeName || primary.user.college || "Independent Institution";
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
            results: e.registrations.map((r) => ({
              id: r.id,
              result: r.result,
              user: {
                name: r.delegationMember?.name || r.user.name,
                college: r.delegation?.collegeName || r.user.college || "Delegation College",
              },
            })),
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
