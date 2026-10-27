import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateEventPassQr, generateFoodTokenQr } from "@/lib/badgeService";
import { getAppOrigin } from "@/lib/security";
import { getActiveEdition, DEFAULT_EDITION_CONFIG } from "@/lib/eventService";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    // 1. Fetch event registrations
    const registrations = await prisma.registration.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        event: {
          include: {
            coordinator: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            staffCoordinator: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
            studentCoordinator: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        // SECURITY: never expose teammates' badge/food token codes or QR payloads
        delegationMember: {
          select: { id: true, name: true, badgeCode: true, isTeamLead: true },
        },
        delegation: {
          include: {
            members: {
              select: { id: true, name: true, isTeamLead: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Find or associate DelegationMember record
    // SECURITY: match by email only — phone numbers are user-editable in the profile,
    // so a phone match would let a student claim another delegate's pass.
    let member = await prisma.delegationMember.findFirst({
      where: { email: { equals: user.email.toLowerCase().trim(), mode: "insensitive" } },
      include: {
        delegation: {
          include: {
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const origin = getAppOrigin(req);

    // SECURITY: never create a pass on read. Passes (and meal tokens) are only issued through
    // /api/register, otherwise any logged-in account, staff included, would get a redeemable token.
    if (member) {
      // Generate QR codes if missing
      if (!member.qrData || !member.foodQrData) {
        const verifyUrl = `${origin}/badge/${member.badgeCode}`;
        const qrData = member.qrData || (await generateEventPassQr({
          badgeCode: member.badgeCode,
          name: member.name,
          college: user.college || member.delegation?.collegeName || "",
          verifyUrl,
        }));

        const foodQrData = member.foodQrData || (await generateFoodTokenQr({
          foodTokenCode: member.foodTokenCode,
          badgeCode: member.badgeCode,
          name: member.name,
        }));

        member = await prisma.delegationMember.update({
          where: { id: member.id },
          data: { qrData, foodQrData },
          include: { delegation: { include: { members: true } } },
        });
      }
    }

    const pass = member
      ? {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          isTeamLead: member.isTeamLead,
          badgeCode: member.badgeCode,
          foodTokenCode: member.foodTokenCode,
          eventCheckedIn: member.eventCheckedIn,
          foodTokenClaimed: member.foodTokenClaimed,
          foodPreference: (member as any).foodPreference || (user as any).foodPreference || "VEG",
          qrData: member.qrData,
          foodQrData: member.foodQrData,
          badgeUrl: `${origin}/badge/${member.badgeCode}`,
        }
      : null;

    const delegationInfo = member?.delegation
      ? {
          id: member.delegation.id,
          collegeName: member.delegation.collegeName,
          department: member.delegation.department,
          teamName: member.delegation.teamName,
          teamLeadName: member.delegation.teamLeadName,
          teamLeadEmail: member.delegation.teamLeadEmail,
          teamLeadPhone: member.delegation.teamLeadPhone,
          staffInchargeName: member.delegation.staffInchargeName,
          staffInchargeEmail: member.delegation.staffInchargeEmail,
          totalFee: member.delegation.totalFee,
          paymentStatus: member.delegation.paymentStatus,
          memberCount: member.delegation.members?.length || 1,
        }
      : null;

    const isApproved =
      registrations.some((r) => r.status === "CONFIRMED") ||
      member?.delegation?.paymentStatus === "PAID" ||
      member?.delegation?.paymentStatus === "VERIFIED";

    const activeEdition = await getActiveEdition();
    let showStageMode = Boolean(activeEdition?.showStageModeInStudentPortal);

    if (activeEdition?.id && activeEdition.id !== "default-shine") {
      try {
        const rawEd: any = await prisma.$queryRaw`
          SELECT "showStageModeInStudentPortal", "startDate", "participantFee", "institutionName", "name", "edition"
          FROM "event_editions"
          WHERE "id" = ${activeEdition.id}
          LIMIT 1
        `;
        if (rawEd && rawEd[0]) {
          if (rawEd[0].showStageModeInStudentPortal !== undefined) {
            showStageMode = Boolean(rawEd[0].showStageModeInStudentPortal);
          }
          if (rawEd[0].startDate) activeEdition.startDate = rawEd[0].startDate;
          if (rawEd[0].participantFee !== undefined && rawEd[0].participantFee !== null) {
            activeEdition.participantFee = Number(rawEd[0].participantFee);
          }
          if (rawEd[0].institutionName) activeEdition.institutionName = rawEd[0].institutionName;
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      isApproved,
      showStageMode,
      registrations,
      pass,
      delegation: delegationInfo,
      edition: {
        startDate: activeEdition.startDate,
        participantFee: activeEdition.participantFee ?? 0,
        institutionName: activeEdition.institutionName || DEFAULT_EDITION_CONFIG.institutionName,
        name: activeEdition.name || DEFAULT_EDITION_CONFIG.name,
        edition: activeEdition.edition || DEFAULT_EDITION_CONFIG.edition,
        venue: activeEdition.venue,
        diningHallVenue: activeEdition.diningHallVenue || null,
        floorPlanUrl: activeEdition.floorPlanUrl || DEFAULT_EDITION_CONFIG.floorPlanUrl,
        logoUrl: activeEdition.logoUrl,
        institutionCrestUrl: activeEdition.institutionCrestUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching student registrations:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch registrations." }, { status: 500 });
  }
}

// PATCH: Disallow participant from modifying dietary preference after registration
export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      message: "Dietary food preference cannot be modified after registration has been completed.",
    },
    { status: 403 }
  );
}
