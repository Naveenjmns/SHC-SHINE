import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveEdition, DEFAULT_EDITION_CONFIG } from "@/lib/eventService";
import { generateFoodTokenQr, generateEventPassQr } from "@/lib/badgeService";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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

    // SECURITY: The badge URL is printed in the pass QR and shareable, so anyone may hold it.
    // Contact details and the meal token (redeemable on its own) are only shown to the pass
    // owner or to admin / food desk staff.
    const session = await getServerSession(authOptions);
    const canSeePrivate =
      !!session &&
      (session.user.role === "ADMIN" ||
        session.user.role === "FOOD_COORDINATOR" ||
        (!!session.user.email && session.user.email.toLowerCase() === member.email.toLowerCase()));

    return NextResponse.json(
      {
        success: true,
        badge: {
          badgeCode: member.badgeCode,
          name: member.name,
          isOwnerView: canSeePrivate,
          email: canSeePrivate ? member.email : null,
          phone: canSeePrivate ? member.phone : null,
          foodTokenCode: canSeePrivate ? member.foodTokenCode : null,
          foodPreference: (member as any).foodPreference || "VEG",
          eventCheckedIn: member.eventCheckedIn,
          eventCheckedInAt: member.eventCheckedInAt,
          foodTokenClaimed: member.foodTokenClaimed,
          foodClaimedAt: member.foodClaimedAt,
          qrData: member.qrData,
          foodQrData: canSeePrivate ? member.foodQrData : null,
          createdAt: member.createdAt,
          delegation: {
            id: member.delegation.id,
            collegeName: member.delegation.collegeName,
            department: member.delegation.department,
            teamName: member.delegation.teamName,
            teamLeadName: member.delegation.teamLeadName,
            teamLeadPhone: canSeePrivate ? member.delegation.teamLeadPhone : null,
            staffInchargeName: member.delegation.staffInchargeName,
            staffInchargePhone: canSeePrivate ? member.delegation.staffInchargePhone : null,
            paymentStatus: member.delegation.paymentStatus,
          },
          events: member.registrations.map((r) => ({
            registrationId: r.id,
            status: r.status,
            eventName: r.event.name,
            category: r.event.category,
            venue: r.event.venue,
            venueZoneId: r.event.venueZoneId,
            prelimsVenue: r.event.prelimsVenue,
            prelimsVenueZoneId: r.event.prelimsVenueZoneId,
            hasPrelims: r.event.hasPrelims,
            rules: r.event.rules,
            staffIncharge: r.event.staffCoordinator?.name || null,
            studentIncharge: r.event.studentCoordinator?.name || null,
          })),
          fest: {
            name: liveEdition?.name || DEFAULT_EDITION_CONFIG.name,
            edition: liveEdition?.edition || DEFAULT_EDITION_CONFIG.edition,
            tagline: liveEdition?.tagline || DEFAULT_EDITION_CONFIG.tagline,
            institutionName: liveEdition?.institutionName || DEFAULT_EDITION_CONFIG.institutionName,
            departmentName: liveEdition?.hostDepartment || DEFAULT_EDITION_CONFIG.hostDepartment,
            venue: liveEdition?.venue || DEFAULT_EDITION_CONFIG.venue,
            diningHallVenue: (liveEdition as any)?.diningHallVenue || DEFAULT_EDITION_CONFIG.diningHallVenue,
            floorPlanUrl: liveEdition?.floorPlanUrl || DEFAULT_EDITION_CONFIG.floorPlanUrl,
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
