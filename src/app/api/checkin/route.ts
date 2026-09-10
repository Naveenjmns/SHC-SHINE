import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { buildSecureErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Extracts normalized clean code from scanned QR or typed input.
 * Handles raw badge codes, food token codes, and JSON stringified payloads.
 */
function extractLookupCode(rawInput: string): { code: string; typeHint?: "EVENT" | "FOOD" } {
  const trimmed = rawInput.trim();

  // Handle JSON encoded QR codes
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.code) {
        return {
          code: String(parsed.code).toUpperCase().trim(),
          typeHint: parsed.type === "FOOD_TOKEN" ? "FOOD" : "EVENT",
        };
      }
      if (parsed.b) return { code: String(parsed.b).toUpperCase().trim(), typeHint: "EVENT" };
      if (parsed.f) return { code: String(parsed.f).toUpperCase().trim(), typeHint: "FOOD" };
    } catch {
      // Fall through to plain text
    }
  }

  // Handle URLs like https://.../badge/SHN27-DEL-XXXX
  if (trimmed.includes("/badge/")) {
    const parts = trimmed.split("/badge/");
    const slug = parts[parts.length - 1].split(/[?#]/)[0];
    return { code: slug.toUpperCase().trim(), typeHint: "EVENT" };
  }

  const upper = trimmed.toUpperCase();
  if (upper.startsWith("FT-")) {
    return { code: upper, typeHint: "FOOD" };
  }

  return { code: upper };
}

// GET: Lookup delegate by Badge Code or Food Token Code
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "COORDINATOR" &&
        session.user.role !== "ADMIN" &&
        !(session.user as any).isEventCoordinator)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Staff or Coordinator login required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawCode = searchParams.get("code");
    if (!rawCode) {
      return NextResponse.json(
        { success: false, message: "Please scan a QR code or enter a badge/token code." },
        { status: 400 }
      );
    }

    const { code, typeHint } = extractLookupCode(rawCode);

    // Search by badgeCode or foodTokenCode
    const member = await prisma.delegationMember.findFirst({
      where: {
        OR: [
          { badgeCode: { equals: code, mode: "insensitive" } },
          { foodTokenCode: { equals: code, mode: "insensitive" } },
        ],
      },
      include: {
        delegation: true,
        registrations: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                category: true,
                venue: true,
                dateTime: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        {
          success: false,
          message: `No participant delegate found matching code "${code}".`,
        },
        { status: 404 }
      );
    }

    // Get assigned event IDs for the logged in coordinator/staff
    const isAdmin = session.user.role === "ADMIN";
    const userAssignedEvents = await prisma.event.findMany({
      where: isAdmin
        ? {}
        : {
            OR: [
              { staffCoordinatorId: session.user.id },
              { studentCoordinatorId: session.user.id },
              { coordinatorId: session.user.id },
              { staffCoordinatorEmail: { equals: session.user.email || "", mode: "insensitive" } },
              { studentCoordinatorEmail: { equals: session.user.email || "", mode: "insensitive" } },
            ],
          },
      select: { id: true, name: true },
    });
    const assignedEventIds = new Set(userAssignedEvents.map((e) => e.id));

    const allEventsAttended = member.registrations.length > 0 && member.registrations.every((r) => r.attended);

    return NextResponse.json({
      success: true,
      typeHint,
      isAdmin,
      assignedEvents: userAssignedEvents,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        badgeCode: member.badgeCode,
        foodTokenCode: member.foodTokenCode,
        eventCheckedIn: member.eventCheckedIn,
        eventCheckedInAt: member.eventCheckedInAt,
        eventCheckedInBy: member.eventCheckedInBy,
        allEventsAttended,
        foodTokenClaimed: member.foodTokenClaimed,
        foodClaimedAt: member.foodClaimedAt,
        foodClaimedBy: member.foodClaimedBy,
        collegeName: member.delegation.collegeName,
        department: member.delegation.department,
        teamName: member.delegation.teamName,
        teamLeadName: member.delegation.teamLeadName,
        teamLeadPhone: member.delegation.teamLeadPhone,
        staffInchargeName: member.delegation.staffInchargeName,
        staffInchargePhone: member.delegation.staffInchargePhone,
        totalFee: member.delegation.totalFee,
        paymentStatus: member.delegation.paymentStatus,
        isPaid: member.delegation.paymentStatus === "PAID",
        registrations: member.registrations.map((r) => ({
          registrationId: r.id,
          eventId: r.event.id,
          eventName: r.event.name,
          category: r.event.category,
          venue: r.event.venue,
          dateTime: r.event.dateTime,
          status: r.status,
          score: r.score,
          result: r.result,
          attended: r.attended,
          checkedInAt: r.checkedInAt,
          checkedInBy: r.checkedInBy,
          canCheckIn: isAdmin || assignedEventIds.has(r.event.id),
        })),
      },
    });
  } catch (error: any) {
    const secureError = buildSecureErrorResponse(error, "GET /api/checkin", "Failed to lookup participant.");
    return NextResponse.json(
      { success: false, message: secureError.message },
      { status: 500 }
    );
  }
}

// POST: Perform Event Check-In or Food Token Claim
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "COORDINATOR" &&
        session.user.role !== "ADMIN" &&
        !(session.user as any).isEventCoordinator)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Staff or Coordinator login required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { code: rawCode, action, eventId } = body;

    if (!rawCode || !action) {
      return NextResponse.json(
        { success: false, message: "Code and action are required." },
        { status: 400 }
      );
    }

    const { code } = extractLookupCode(rawCode);
    const member = await prisma.delegationMember.findFirst({
      where: {
        OR: [
          { badgeCode: { equals: code, mode: "insensitive" } },
          { foodTokenCode: { equals: code, mode: "insensitive" } },
        ],
      },
      include: {
        delegation: true,
        registrations: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: `Delegate not found with code "${code}".` },
        { status: 404 }
      );
    }

    const actorName = session.user.name || session.user.email || "Coordinator";
    const isAdmin = session.user.role === "ADMIN";

    // 1. EVENT CHECK-IN ACTION
    if (action === "EVENT_CHECKIN") {
      // Payment Guard: Must be PAID at registration desk
      if (member.delegation.paymentStatus !== "PAID") {
        return NextResponse.json(
          {
            success: false,
            paymentPending: true,
            message: `Registration Desk Payment Required: ${member.name}'s contingent fee is currently UNPAID (${member.delegation.paymentStatus}). Please direct student to Registration Desk to pay ₹${member.delegation.totalFee} and collect approval before venue entry.`,
          },
          { status: 403 }
        );
      }

      if (!eventId) {
        return NextResponse.json(
          {
            success: false,
            message: "Event ID is required. Please specify which competition you are checking this student in for.",
          },
          { status: 400 }
        );
      }

      // Verify the target event exists
      const targetEvent = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!targetEvent) {
        return NextResponse.json(
          { success: false, message: "Target competition event not found." },
          { status: 404 }
        );
      }

      // Scoped Coordinator Rule: Coordinator of Event A cannot check in for Event B
      const isAssigned =
        isAdmin ||
        targetEvent.staffCoordinatorId === session.user.id ||
        targetEvent.studentCoordinatorId === session.user.id ||
        targetEvent.coordinatorId === session.user.id ||
        (targetEvent.staffCoordinatorEmail &&
          targetEvent.staffCoordinatorEmail.toLowerCase() === session.user.email?.toLowerCase()) ||
        (targetEvent.studentCoordinatorEmail &&
          targetEvent.studentCoordinatorEmail.toLowerCase() === session.user.email?.toLowerCase());

      if (!isAssigned) {
        return NextResponse.json(
          {
            success: false,
            message: `Unauthorized Check-In: You are not assigned to coordinate "${targetEvent.name}". Coordinators can only check in participants for their own assigned events.`,
          },
          { status: 403 }
        );
      }

      // Check if student is registered for this event
      const reg = member.registrations.find((r) => r.eventId === targetEvent.id);
      if (!reg) {
        const registeredList = member.registrations.map((r) => r.event.name).join(", ");
        return NextResponse.json(
          {
            success: false,
            message: `Registration Mismatch: ${member.name} is NOT registered for "${targetEvent.name}". They are registered for: ${registeredList || "None"}.`,
          },
          { status: 400 }
        );
      }

      // Check if student's registration for this event is approved
      if (reg.status !== "CONFIRMED") {
        return NextResponse.json(
          {
            success: false,
            paymentPending: true,
            message: `Event Registration Not Confirmed: ${member.name}'s registration for "${targetEvent.name}" is "${reg.status}". Please direct the student to Registration Desk.`,
          },
          { status: 403 }
        );
      }

      // Prevent duplicate event check-in
      if (reg.attended) {
        return NextResponse.json(
          {
            success: false,
            alreadyCheckedIn: true,
            message: `${member.name} is already checked in for "${targetEvent.name}" on ${
              reg.checkedInAt
                ? new Date(reg.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                : "earlier today"
            } by ${reg.checkedInBy || "Coordinator"}.`,
          },
          { status: 409 }
        );
      }

      // Mark this specific event registration as attended
      await prisma.registration.update({
        where: { id: reg.id },
        data: {
          attended: true,
          checkedInAt: new Date(),
          checkedInBy: actorName,
        },
      });

      // Check overall student attendance across all registered events
      const allRegs = await prisma.registration.findMany({
        where: { delegationMemberId: member.id },
      });
      const allEventsCompleted = allRegs.every((r) => r.attended);

      // Update delegationMember
      const updatedMember = await prisma.delegationMember.update({
        where: { id: member.id },
        data: {
          eventCheckedIn: allEventsCompleted,
          eventCheckedInAt: new Date(),
          eventCheckedInBy: actorName,
        },
      });

      await logActivity({
        action: "DELEGATE_CHECKIN",
        actorId: session.user.id,
        actorName,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Registration",
        targetId: reg.id,
        targetTitle: `Checked In: ${member.name} for "${targetEvent.name}"`,
        details: {
          badgeCode: member.badgeCode,
          studentName: member.name,
          eventName: targetEvent.name,
          eventId: targetEvent.id,
          allEventsCompleted,
        },
      });

      const remainingEventsCount = allRegs.filter((r) => !r.attended).length;

      return NextResponse.json({
        success: true,
        message: `Successfully marked ${member.name} Present for "${targetEvent.name}"!${
          remainingEventsCount > 0
            ? ` (Pass remains valid for ${remainingEventsCount} other registered event${remainingEventsCount > 1 ? "s" : ""})`
            : " (All registered events checked in - Pass completed!)"
        }`,
        member: {
          ...member,
          eventCheckedIn: allEventsCompleted,
          eventCheckedInAt: updatedMember.eventCheckedInAt,
          eventCheckedInBy: updatedMember.eventCheckedInBy,
        },
      });
    }

    // 2. EVENT UNCHECK ACTION
    if (action === "EVENT_UNCHECK") {
      if (eventId) {
        await prisma.registration.updateMany({
          where: { delegationMemberId: member.id, eventId },
          data: {
            attended: false,
            checkedInAt: null,
            checkedInBy: null,
          },
        });
      } else {
        await prisma.registration.updateMany({
          where: { delegationMemberId: member.id },
          data: {
            attended: false,
            checkedInAt: null,
            checkedInBy: null,
          },
        });
      }

      await prisma.delegationMember.update({
        where: { id: member.id },
        data: {
          eventCheckedIn: false,
          eventCheckedInAt: null,
          eventCheckedInBy: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Check-in reverted for ${member.name}.`,
        member: {
          ...member,
          eventCheckedIn: false,
          eventCheckedInAt: null,
          eventCheckedInBy: null,
        },
      });
    }

    if (action === "FOOD_CLAIM") {
      if (member.delegation.paymentStatus !== "PAID") {
        return NextResponse.json(
          {
            success: false,
            paymentPending: true,
            message: `Payment Desk Approval Required: ${member.name}'s contingent fee is UNPAID (${member.delegation.paymentStatus}). Food tokens cannot be issued until payment is verified at the Registration Desk.`,
          },
          { status: 403 }
        );
      }

      if (member.foodTokenClaimed) {
        return NextResponse.json(
          {
            success: false,
            alreadyClaimed: true,
            message: `Warning: Food already received by ${member.name} on ${
              member.foodClaimedAt
                ? new Date(member.foodClaimedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "earlier today"
            } (Claim verified by ${member.foodClaimedBy || "staff"}).`,
            member,
          },
          { status: 409 }
        );
      }

      const updated = await prisma.delegationMember.update({
        where: { id: member.id },
        data: {
          foodTokenClaimed: true,
          foodClaimedAt: new Date(),
          foodClaimedBy: actorName,
        },
      });

      await logActivity({
        action: "FOOD_TOKEN_CLAIMED",
        actorId: session.user.id,
        actorName,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Registration",
        targetId: member.id,
        targetTitle: `Food Issued: ${member.name} (${member.foodTokenCode})`,
        details: {
          foodTokenCode: member.foodTokenCode,
          badgeCode: member.badgeCode,
          studentName: member.name,
          college: member.delegation.collegeName,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Food token verified! 1x Meal issued to ${member.name}.`,
        member: {
          ...member,
          foodTokenClaimed: true,
          foodClaimedAt: updated.foodClaimedAt,
          foodClaimedBy: updated.foodClaimedBy,
        },
      });
    }

    if (action === "FOOD_UNCLAIM") {
      const updated = await prisma.delegationMember.update({
        where: { id: member.id },
        data: {
          foodTokenClaimed: false,
          foodClaimedAt: null,
          foodClaimedBy: null,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Food claim status reset to Unclaimed for ${member.name}.`,
        member: {
          ...member,
          foodTokenClaimed: false,
          foodClaimedAt: null,
          foodClaimedBy: null,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: `Unknown action "${action}".` },
      { status: 400 }
    );
  } catch (error: any) {
    const secureError = buildSecureErrorResponse(error, "POST /api/checkin", "Failed to process check-in action.");
    return NextResponse.json(
      { success: false, message: secureError.message },
      { status: 500 }
    );
  }
}
