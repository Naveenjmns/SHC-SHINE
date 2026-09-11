import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateBadgeCode, generateFoodTokenCode, generateEventPassQr, generateFoodTokenQr } from "@/lib/badgeService";
import { getActiveEdition } from "@/lib/eventService";

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
        delegationMember: true,
        delegation: {
          include: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Find or associate DelegationMember record
    let member = await prisma.delegationMember.findFirst({
      where: {
        OR: [
          { email: user.email.toLowerCase().trim() },
          ...(user.phone ? [{ phone: user.phone.trim() }] : []),
        ],
      },
      include: {
        delegation: {
          include: {
            members: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${hostHeader}`;

    // If student has no DelegationMember record yet, auto-create one linked to active edition
    if (!member) {
      const activeEdition = await getActiveEdition();
      const editionYear = activeEdition?.edition || "2026";
      const badgeCode = generateBadgeCode(editionYear);
      const foodTokenCode = generateFoodTokenCode(badgeCode);
      const verifyUrl = `${origin}/badge/${badgeCode}`;

      const qrData = await generateEventPassQr({
        badgeCode,
        name: user.name,
        college: user.college || "",
        verifyUrl,
      });

      const foodQrData = await generateFoodTokenQr({
        foodTokenCode,
        badgeCode,
        name: user.name,
      });

      // Find or create default delegation
      let delegation = await prisma.delegation.findFirst({
        where: {
          teamLeadEmail: user.email.toLowerCase().trim(),
        },
        include: { members: true },
      });

      if (!delegation && activeEdition.id) {
        delegation = await prisma.delegation.create({
          data: {
            editionId: activeEdition.id,
            collegeName: user.college || "Individual Participant",
            teamName: `${user.name}'s Contingent`,
            teamLeadName: user.name,
            teamLeadEmail: user.email.toLowerCase().trim(),
            teamLeadPhone: user.phone || "+91 9876543210",
            totalFee: activeEdition.participantFee || 0,
            paymentStatus: (activeEdition.participantFee || 0) === 0 ? "PAID" : "PENDING",
          },
          include: { members: true },
        });
      }

      if (delegation) {
        member = await prisma.delegationMember.create({
          data: {
            delegationId: delegation.id,
            name: user.name,
            email: user.email.toLowerCase().trim(),
            phone: user.phone || "+91 9876543210",
            isTeamLead: true,
            badgeCode,
            foodTokenCode,
            foodPreference: (user as any).foodPreference || "VEG",
            qrData,
            foodQrData,
          },
          include: { delegation: { include: { members: true } } },
        });
      }
    } else {
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
        participantFee: activeEdition.participantFee || 200,
        institutionName: activeEdition.institutionName || "Sacred Heart College (Autonomous)",
        name: activeEdition.name || "SHINE",
        edition: activeEdition.edition || "26",
        venue: activeEdition.venue,
      },
    });
  } catch (error) {
    console.error("Error fetching student registrations:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch registrations." }, { status: 500 });
  }
}

// PATCH: Allow logged-in student to update their dietary food preference (VEG <-> NON_VEG)
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const preference = String(body.preference || "").toUpperCase().trim();
    if (preference !== "VEG" && preference !== "NON_VEG") {
      return NextResponse.json(
        { success: false, message: "Invalid preference. Must be VEG or NON_VEG." },
        { status: 400 }
      );
    }

    const email = session.user.email.toLowerCase().trim();

    // Find the student's delegation member record
    const member = await prisma.delegationMember.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
    });

    if (member) {
      if (member.foodTokenClaimed) {
        return NextResponse.json(
          {
            success: false,
            message: "Your food token has already been served and redeemed. Dietary preference cannot be changed.",
          },
          { status: 400 }
        );
      }

      await prisma.delegationMember.update({
        where: { id: member.id },
        data: { foodPreference: preference },
      });
    }

    // Also update User account record
    await prisma.user.updateMany({
      where: { email: { equals: email, mode: "insensitive" } },
      data: { foodPreference: preference },
    });

    return NextResponse.json({
      success: true,
      foodPreference: preference,
      message: `Dietary preference successfully changed to ${preference === "VEG" ? "Vegetarian (🥗)" : "Non-Vegetarian (🍗)"}.`,
    });
  } catch (error: any) {
    console.error("Error updating food preference:", error);
    return NextResponse.json({ success: false, message: "Failed to update dietary preference." }, { status: 500 });
  }
}
