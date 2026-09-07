import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActiveEdition } from "@/lib/eventService";

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

    const member = await prisma.delegationMember.findUnique({
      where: { badgeCode: badgeCode.toUpperCase() },
      include: {
        delegation: true,
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

    const edition = await getActiveEdition();

    return NextResponse.json({
      success: true,
      badge: {
        badgeCode: member.badgeCode,
        name: member.name,
        email: member.email,
        phone: member.phone,
        foodTokenCode: member.foodTokenCode,
        foodTokenClaimed: member.foodTokenClaimed,
        qrData: member.qrData,
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
          name: edition.name,
          edition: edition.edition,
          tagline: edition.tagline,
          institutionName: edition.institutionName,
          departmentName: edition.hostDepartment,
          venue: edition.venue,
          startDate: edition.startDate,
          endDate: edition.endDate,
        },
      },
    });
  } catch (error: any) {
    console.error("Badge lookup error:", error);
    return NextResponse.json(
      { success: false, message: "Error looking up badge." },
      { status: 500 }
    );
  }
}
