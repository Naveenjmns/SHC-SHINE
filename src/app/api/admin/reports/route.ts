import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveEdition } from "@/lib/eventService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const editionIdParam = searchParams.get("editionId");

    let edition;
    if (editionIdParam) {
      edition = await prisma.eventEdition.findUnique({
        where: { id: editionIdParam },
      });
    }

    if (!edition) {
      edition = await getActiveEdition();
    }

    const editionWhere =
      edition && edition.id && edition.id !== "default-shine"
        ? { editionId: edition.id }
        : {};

    // 1. Fetch all events with staff, student & legacy coordinators, and all registrations
    const events = await prisma.event.findMany({
      where: editionWhere,
      include: {
        staffCoordinator: {
          select: { id: true, name: true, email: true, phone: true, college: true },
        },
        studentCoordinator: {
          select: { id: true, name: true, email: true, phone: true, college: true },
        },
        coordinator: {
          select: { id: true, name: true, email: true, phone: true, college: true },
        },
        registrations: {
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true, college: true },
            },
            delegation: {
              select: {
                id: true,
                collegeName: true,
                department: true,
                teamName: true,
                teamLeadName: true,
                teamLeadPhone: true,
                teamLeadEmail: true,
                staffInchargeName: true,
                staffInchargePhone: true,
                staffInchargeEmail: true,
                paymentStatus: true,
                totalFee: true,
              },
            },
            delegationMember: {
              select: {
                id: true,
                badgeCode: true,
                foodTokenCode: true,
                eventCheckedIn: true,
                eventCheckedInAt: true,
                foodTokenClaimed: true,
                foodClaimedAt: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ category: "asc" }, { dateTime: "asc" }, { name: "asc" }],
    });

    // 2. Fetch all delegations with members
    const delegations = await prisma.delegation.findMany({
      where: editionWhere,
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isTeamLead: true,
            badgeCode: true,
            foodTokenCode: true,
            eventCheckedIn: true,
            eventCheckedInAt: true,
            foodTokenClaimed: true,
            foodClaimedAt: true,
          },
        },
        registrations: {
          select: {
            id: true,
            eventId: true,
            status: true,
            result: true,
            score: true,
            attended: true,
          },
        },
      },
      orderBy: { collegeName: "asc" },
    });

    // 3. Construct Master Student Registration Roster
    // Extract unique students and all their event participations
    const studentMap = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        phone: string;
        college: string;
        department: string | null;
        teamName: string | null;
        isTeamLead: boolean;
        badgeCode: string | null;
        foodTokenCode: string | null;
        attended: boolean;
        checkedInAt: Date | null;
        events: Array<{
          eventId: string;
          eventName: string;
          category: string;
          venue: string | null;
          status: string;
          isPrelimsParticipant: boolean;
          prelimsStatus: string | null;
          prelimsScore: number | null;
          score: number | null;
          result: string | null;
        }>;
      }
    >();

    events.forEach((ev) => {
      ev.registrations.forEach((reg) => {
        const u = reg.user;
        const del = reg.delegation;
        const member = reg.delegationMember;

        if (!studentMap.has(u.id)) {
          studentMap.set(u.id, {
            userId: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || member?.foodTokenCode || "—",
            college: del?.collegeName || u.college || "Independent",
            department: del?.department || null,
            teamName: del?.teamName || null,
            isTeamLead: del?.teamLeadEmail?.toLowerCase() === u.email.toLowerCase(),
            badgeCode: member?.badgeCode || null,
            foodTokenCode: member?.foodTokenCode || null,
            attended: reg.attended || member?.eventCheckedIn || false,
            checkedInAt: reg.checkedInAt || member?.eventCheckedInAt || null,
            events: [],
          });
        }

        const student = studentMap.get(u.id)!;
        if (reg.attended || member?.eventCheckedIn) {
          student.attended = true;
          if (!student.checkedInAt) {
            student.checkedInAt = reg.checkedInAt || member?.eventCheckedInAt || null;
          }
        }

        student.events.push({
          eventId: ev.id,
          eventName: ev.name,
          category: ev.category,
          venue: ev.venue,
          status: reg.status,
          isPrelimsParticipant: reg.isPrelimsParticipant,
          prelimsStatus: reg.prelimsStatus,
          prelimsScore: reg.prelimsScore,
          score: reg.score,
          result: reg.result,
        });
      });
    });

    const masterStudentRoster = Array.from(studentMap.values()).sort((a, b) =>
      a.college.localeCompare(b.college) || a.name.localeCompare(b.name)
    );

    // 4. Construct Prelims to Mains Progression Report
    const prelimsProgression: Array<{
      registrationId: string;
      eventId: string;
      eventName: string;
      eventCategory: string;
      prelimsVenue: string | null;
      prelimsDateTime: Date | null;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
      collegeName: string;
      prelimsStatus: string;
      prelimsScore: number | null;
      prelimsNotes: string | null;
      clearedToMains: boolean;
      mainsScore: number | null;
      finalResult: string | null;
    }> = [];

    events.forEach((ev) => {
      ev.registrations.forEach((reg) => {
        if (reg.isPrelimsParticipant || ev.hasPrelims) {
          const statusUpper = (reg.prelimsStatus || "PENDING").toUpperCase();
          const cleared =
            statusUpper === "QUALIFIED" ||
            statusUpper === "SELECTED" ||
            statusUpper === "CLEARED" ||
            statusUpper === "PASSED" ||
            statusUpper === "SHORTLISTED" ||
            statusUpper === "MAINS";

          prelimsProgression.push({
            registrationId: reg.id,
            eventId: ev.id,
            eventName: ev.name,
            eventCategory: ev.category,
            prelimsVenue: ev.prelimsVenue || ev.venue,
            prelimsDateTime: ev.prelimsDateTime || ev.dateTime,
            studentName: reg.user.name,
            studentEmail: reg.user.email,
            studentPhone: reg.user.phone || "—",
            collegeName: reg.delegation?.collegeName || reg.user.college || "Independent",
            prelimsStatus: reg.prelimsStatus || "PENDING",
            prelimsScore: reg.prelimsScore,
            prelimsNotes: reg.prelimsNotes,
            clearedToMains: cleared,
            mainsScore: reg.score,
            finalResult: reg.result,
          });
        }
      });
    });

    // 5. Construct Final Results & Winners List
    const finalResults: Array<{
      registrationId: string;
      eventId: string;
      eventName: string;
      eventCategory: string;
      studentName: string;
      studentEmail: string;
      collegeName: string;
      score: number | null;
      result: string;
      rank: number; // 1 for 1st, 2 for 2nd, 3 for 3rd, 99 for others
    }> = [];

    events.forEach((ev) => {
      ev.registrations.forEach((reg) => {
        if (reg.result && reg.result.trim().length > 0) {
          const res = reg.result.trim();
          const lower = res.toLowerCase();

          let rank = 99;
          if (lower.includes("1st") || lower.includes("first") || lower.includes("winner") || lower.includes("gold")) {
            rank = 1;
          } else if (lower.includes("2nd") || lower.includes("second") || lower.includes("runner") || lower.includes("silver")) {
            rank = 2;
          } else if (lower.includes("3rd") || lower.includes("third") || lower.includes("bronze")) {
            rank = 3;
          }

          finalResults.push({
            registrationId: reg.id,
            eventId: ev.id,
            eventName: ev.name,
            eventCategory: ev.category,
            studentName: reg.user.name,
            studentEmail: reg.user.email,
            collegeName: reg.delegation?.collegeName || reg.user.college || "Independent",
            score: reg.score,
            result: res,
            rank,
          });
        }
      });
    });

    finalResults.sort((a, b) => a.eventName.localeCompare(b.eventName) || a.rank - b.rank);

    // 6. Compute Overall College Championship Standings
    // Scoring system: 1st Place = 10 pts, 2nd Place = 7 pts, 3rd Place = 5 pts, Special Award = 2 pts
    const collegePointsMap = new Map<
      string,
      {
        collegeName: string;
        goldCount: number;
        silverCount: number;
        bronzeCount: number;
        otherAwardsCount: number;
        totalPoints: number;
        participantsCount: number;
        eventsEnrolledCount: number;
      }
    >();

    // Initialize with all colleges from delegations
    delegations.forEach((d) => {
      collegePointsMap.set(d.collegeName, {
        collegeName: d.collegeName,
        goldCount: 0,
        silverCount: 0,
        bronzeCount: 0,
        otherAwardsCount: 0,
        totalPoints: 0,
        participantsCount: d.members.length,
        eventsEnrolledCount: d.registrations.length,
      });
    });

    // Populate points from final results
    finalResults.forEach((win) => {
      const col = win.collegeName;
      if (!collegePointsMap.has(col)) {
        collegePointsMap.set(col, {
          collegeName: col,
          goldCount: 0,
          silverCount: 0,
          bronzeCount: 0,
          otherAwardsCount: 0,
          totalPoints: 0,
          participantsCount: 0,
          eventsEnrolledCount: 0,
        });
      }

      const rec = collegePointsMap.get(col)!;
      if (win.rank === 1) {
        rec.goldCount += 1;
        rec.totalPoints += 10;
      } else if (win.rank === 2) {
        rec.silverCount += 1;
        rec.totalPoints += 7;
      } else if (win.rank === 3) {
        rec.bronzeCount += 1;
        rec.totalPoints += 5;
      } else {
        rec.otherAwardsCount += 1;
        rec.totalPoints += 2;
      }
    });

    const championshipLeaderboard = Array.from(collegePointsMap.values()).sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.goldCount - a.goldCount ||
        b.silverCount - a.silverCount ||
        b.bronzeCount - a.bronzeCount ||
        a.collegeName.localeCompare(b.collegeName)
    );

    // 7. Key Executive Fest Metrics Summary
    const totalRegistrations = events.reduce((sum, e) => sum + e.registrations.length, 0);
    const attendedStudentsCount = Array.from(studentMap.values()).filter((s) => s.attended).length;
    const prelimsNomineesCount = prelimsProgression.length;
    const prelimsClearedCount = prelimsProgression.filter((p) => p.clearedToMains).length;

    const summaryMetrics = {
      festName: edition?.name || "SHINE",
      festEdition: edition?.edition || "2026",
      tagline: edition?.tagline || "Where Ideas Begin to Shine",
      institutionName:
        edition?.institutionName || "SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR",
      accreditationText:
        edition?.accreditationText ||
        "Accredited by NAAC (5th Cycle - Under RAF) with a CGPA of 3.53/4 at 'A++' Grade, Affiliated to Thiruvalluvar University",
      hostDepartment:
        edition?.hostDepartment || "DEPARTMENT OF COMPUTER APPLICATIONS (PG)",
      venue: edition?.venue || "SGB Main Auditorium, Sacred Heart College, Tirupattur",
      startDate: edition?.startDate,
      endDate: edition?.endDate,
      contactEmail: edition?.contactEmail || "shine@shctpt.edu",
      contactPhone: edition?.contactPhone || "+91 4175 240464",
      totalEvents: events.length,
      onStageEventsCount: events.filter((e) => e.category === "ON_STAGE").length,
      offStageEventsCount: events.filter((e) => e.category === "OFF_STAGE").length,
      eventsWithPrelimsCount: events.filter((e) => e.hasPrelims).length,
      totalCollegesCount: delegations.length,
      totalUniqueStudentsCount: studentMap.size,
      totalRegistrationsCount: totalRegistrations,
      attendedStudentsCount,
      attendancePercentage:
        studentMap.size > 0
          ? Math.round((attendedStudentsCount / studentMap.size) * 100)
          : 0,
      prelimsNomineesCount,
      prelimsClearedCount,
      totalWinnersCount: finalResults.length,
      overallChampionCollege: championshipLeaderboard[0]?.totalPoints > 0 ? championshipLeaderboard[0] : null,
      overallRunnerUpCollege: championshipLeaderboard[1]?.totalPoints > 0 ? championshipLeaderboard[1] : null,
      generatedAt: new Date().toISOString(),
      generatedBy: {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
    };

    // Clean Event Catalog with Coordinators & Participant Counts
    const eventsCatalog = events.map((ev) => {
      const staffName =
        ev.staffCoordinatorName || ev.staffCoordinator?.name || "Faculty In-Charge";
      const staffEmail =
        ev.staffCoordinatorEmail || ev.staffCoordinator?.email || "—";
      const staffPhone =
        ev.staffCoordinatorPhone || ev.staffCoordinator?.phone || "—";

      const studentName =
        ev.studentCoordinatorName || ev.studentCoordinator?.name || "Student Coordinator";
      const studentEmail =
        ev.studentCoordinatorEmail || ev.studentCoordinator?.email || "—";
      const studentPhone =
        ev.studentCoordinatorPhone || ev.studentCoordinator?.phone || "—";

      return {
        id: ev.id,
        name: ev.name,
        category: ev.category,
        description: ev.description,
        venue: ev.venue || "Campus Lab / Auditorium",
        dateTime: ev.dateTime,
        rules: ev.rules,
        fee: ev.fee,
        capacity: ev.capacity,
        hasPrelims: ev.hasPrelims,
        prelimsDateTime: ev.prelimsDateTime,
        prelimsVenue: ev.prelimsVenue,
        prelimsRules: ev.prelimsRules,
        staffCoordinator: {
          name: staffName,
          email: staffEmail,
          phone: staffPhone,
        },
        studentCoordinator: {
          name: studentName,
          email: studentEmail,
          phone: studentPhone,
        },
        registrationsCount: ev.registrations.length,
        attendedCount: ev.registrations.filter((r) => r.attended || r.delegationMember?.eventCheckedIn).length,
        prelimsCount: ev.registrations.filter((r) => r.isPrelimsParticipant).length,
        winnersCount: ev.registrations.filter((r) => r.result).length,
      };
    });

    return NextResponse.json({
      success: true,
      report: {
        summary: summaryMetrics,
        events: eventsCatalog,
        delegations: delegations.map((d) => ({
          id: d.id,
          collegeName: d.collegeName,
          department: d.department,
          teamName: d.teamName,
          teamLeadName: d.teamLeadName,
          teamLeadEmail: d.teamLeadEmail,
          teamLeadPhone: d.teamLeadPhone,
          staffInchargeName: d.staffInchargeName,
          staffInchargePhone: d.staffInchargePhone,
          staffInchargeEmail: d.staffInchargeEmail,
          memberCount: d.members.length,
          paymentStatus: d.paymentStatus,
          totalFee: d.totalFee,
          checkedInCount: d.members.filter((m) => m.eventCheckedIn).length,
          foodClaimedCount: d.members.filter((m) => m.foodTokenClaimed).length,
        })),
        masterStudentRoster,
        prelimsProgression,
        finalResults,
        championshipLeaderboard,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
