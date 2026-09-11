import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveEdition } from "@/lib/eventService";
import { generateFoodTokenQr, generateEventPassQr } from "@/lib/badgeService";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ badgeCode: string }> }
) {
  try {
    const { badgeCode } = await params;
    if (!badgeCode) {
      return NextResponse.json(
        { success: false, message: "Badge code is required." },
        { status: 400 }
      );
    }

    let member = await prisma.delegationMember.findUnique({
      where: { badgeCode: badgeCode.toUpperCase() },
      include: {
        delegation: {
          include: {
            edition: true,
          },
        },
        registrations: {
          include: {
            event: {
              include: {
                staffCoordinator: { select: { name: true, phone: true } },
                studentCoordinator: { select: { name: true, phone: true } },
              },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "No delegate found matching this badge code." },
        { status: 404 }
      );
    }

    // Auto-generate missing foodQrData or qrData if necessary for existing records
    if (!member.foodQrData || !member.qrData) {
      const qrData =
        member.qrData ||
        (await generateEventPassQr({
          badgeCode: member.badgeCode,
          name: member.name,
          college: member.delegation.collegeName,
        }));

      const foodQrData =
        member.foodQrData ||
        (await generateFoodTokenQr({
          foodTokenCode: member.foodTokenCode,
          badgeCode: member.badgeCode,
          name: member.name,
        }));

      member = await prisma.delegationMember.update({
        where: { id: member.id },
        data: { qrData, foodQrData },
        include: {
          delegation: {
            include: {
              edition: true,
            },
          },
          registrations: {
            include: {
              event: {
                include: {
                  staffCoordinator: { select: { name: true, phone: true } },
                  studentCoordinator: { select: { name: true, phone: true } },
                },
              },
            },
          },
        },
      });
    }

    // Resolve live edition directly from delegation, DB, or fallback for 100% dynamic updates
    const liveEdition =
      (member.delegation as any)?.edition ||
      (await prisma.eventEdition.findFirst({ where: { isActive: true } })) ||
      (await getActiveEdition());

    return NextResponse.json(
      {
        success: true,
        badge: {
          badgeCode: member.badgeCode,
          name: member.name,
          email: member.email,
          phone: member.phone,
          foodTokenCode: member.foodTokenCode,
          foodPreference: (member as any).foodPreference || "VEG",
          eventCheckedIn: member.eventCheckedIn,
          eventCheckedInAt: member.eventCheckedInAt,
          foodTokenClaimed: member.foodTokenClaimed,
          foodClaimedAt: member.foodClaimedAt,
          qrData: member.qrData,
          foodQrData: member.foodQrData,
          createdAt: member.createdAt,
          delegation: {
            id: member.delegation.id,
            collegeName: member.delegation.collegeName,
            department: member.delegation.department,
            teamName: member.delegation.teamName,
            teamLeadName: member.delegation.teamLeadName,
            teamLeadPhone: member.delegation.teamLeadPhone,
            staffInchargeName: member.delegation.staffInchargeName,
            staffInchargePhone: member.delegation.staffInchargePhone,
            paymentStatus: member.delegation.paymentStatus,
          },
          events: member.registrations.map((r) => ({
            registrationId: r.id,
            status: r.status,
            eventName: r.event.name,
            category: r.event.category,
            venue: r.event.venue,
            rules: r.event.rules,
            staffIncharge: r.event.staffCoordinator?.name || null,
            studentIncharge: r.event.studentCoordinator?.name || null,
          })),
          fest: {
            name: liveEdition?.name || "SHINE",
            edition: liveEdition?.edition || "'26",
            tagline: liveEdition?.tagline || "National Level Intercollegiate IT Fest",
            institutionName: liveEdition?.institutionName || "Sacred Heart College (Autonomous)",
            departmentName: liveEdition?.hostDepartment || "Department of Computer Applications (PG)",
            venue: liveEdition?.venue || "SGB Main Auditorium, Sacred Heart College (Autonomous), Tirupattur",
            startDate: liveEdition?.startDate || null,
            endDate: liveEdition?.endDate || null,
          },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("Badge lookup error:", error);
    return NextResponse.json(
      { success: false, message: "Error looking up badge." },
      { status: 500 }
    );
  }
}
