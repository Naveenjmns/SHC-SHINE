import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { buildSecureErrorResponse } from "@/lib/security";

import { extractLookupCode } from "@/lib/cameraScanner";

export const dynamic = "force-dynamic";

// GET: Lookup delegate by Badge Code or Food Token Code
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      (session.user.role !== "COORDINATOR" &&
        session.user.role !== "ADMIN" &&
        session.user.role !== "FOOD_COORDINATOR" &&
        !(session.user as any).isEventCoordinator)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Staff, Coordinator, or Food Committee login required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawCode = searchParams.get("code");
    const requiredType = searchParams.get("type"); // "EVENT" or "FOOD"
    if (!rawCode) {
      return NextResponse.json(
        { success: false, message: "Please scan a QR code or enter a badge/token code." },
        { status: 400 }
      );
    }

    const { code, typeHint } = extractLookupCode(rawCode);

    const isFoodCoordinator = session.user.role === "FOOD_COORDINATOR";
    const isEventCoordinator = session.user.role === "COORDINATOR" || Boolean((session.user as any).isEventCoordinator);
    const isAdmin = session.user.role === "ADMIN";

    // Strict pass type enforcement based on role or explicit requiredType
    const enforceFood = requiredType === "FOOD" || (isFoodCoordinator && !isAdmin);
    const enforceEvent = requiredType === "EVENT" || (isEventCoordinator && !isAdmin && !isFoodCoordinator);

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

    const isCodeBadge = member.badgeCode.toUpperCase() === code.toUpperCase();
    const isCodeFood = member.foodTokenCode.toUpperCase() === code.toUpperCase();

    // Reject Event QR at Food Counter
    if (enforceFood && isCodeBadge && !isCodeFood) {
      return NextResponse.json(
        {
          success: false,
          isWrongType: true,
          message: `Wrong Pass Scanned: You scanned an Event Registration Pass (${code}). Food distribution requires the student's Food Token QR (FT-...). Event passes cannot be used for meals.`,
        },
        { status: 400 }
      );
    }

    // Reject Food QR at Event Check-In
    if (enforceEvent && isCodeFood && !isCodeBadge) {
      return NextResponse.json(
        {
          success: false,
          isWrongType: true,
          message: `Wrong Pass Scanned: You scanned a Food Token QR (${code}). Competition event check-ins require the student's Event Registration Pass QR (${member.badgeCode}). Food tokens cannot be used for event entry.`,
        },
        { status: 400 }
      );
    }

    // Get assigned event IDs for the logged in coordinator/staff
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

    const isApproved =
      member.delegation.paymentStatus === "PAID" ||
      member.delegation.paymentStatus === "VERIFIED" ||
      member.registrations.some((r) => r.status === "CONFIRMED");

    const allEventsAttended = member.registrations.length > 0 && member.registrations.every((r) => r.attended);

    return NextResponse.json({
      success: true,
      typeHint,
      isAdmin,
      isApproved,
      notApproved: !isApproved,
      notApprovedMessage: !isApproved
        ? `QR code is valid, but registration is NOT APPROVED yet. Please direct ${member.name} (${member.delegation.collegeName}) to the Registration Desk to complete spot payment and approval.`
        : null,
      allEventsAttended,
      isExpired: allEventsAttended,
      expiredMessage: allEventsAttended
        ? `QR Code Expired: All registered event check-ins have already been completed for ${member.name} (${member.delegation.collegeName}).`
        : null,
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
        isApproved,
        foodTokenClaimed: member.foodTokenClaimed,
        foodClaimedAt: member.foodClaimedAt,
        foodClaimedBy: member.foodClaimedBy,
        foodPreference: (member as any).foodPreference || "VEG",
        collegeName: member.delegation.collegeName,
        department: member.delegation.department,
        teamName: member.delegation.teamName,
        teamLeadName: member.delegation.teamLeadName,
        teamLeadPhone: member.delegation.teamLeadPhone,
        staffInchargeName: member.delegation.staffInchargeName,
        staffInchargePhone: member.delegation.staffInchargePhone,
        totalFee: member.delegation.totalFee,
        paymentStatus: member.delegation.paymentStatus,
        isPaid: isApproved,
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
        session.user.role !== "FOOD_COORDINATOR" &&
        !(session.user as any).isEventCoordinator)
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Staff, Coordinator, or Food Committee login required." },
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
      if (session.user.role === "FOOD_COORDINATOR") {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized: Food Committee coordinators cannot perform competition event check-ins. Competition check-ins must be conducted by Event Coordinators.",
          },
          { status: 403 }
        );
      }

      // Pass Type Guard: Must be an Event Registration Pass QR
      if (member.foodTokenCode.toUpperCase() === code.toUpperCase() && member.badgeCode.toUpperCase() !== code.toUpperCase()) {
        return NextResponse.json(
          {
            success: false,
            isWrongType: true,
            message: `Wrong Pass Scanned: Scanned code "${code}" is a Food Token QR. Competition event check-ins require the student's Event Registration Pass QR (${member.badgeCode}). Food tokens cannot be used for event entry.`,
          },
          { status: 400 }
        );
      }

      // Approval & Payment Guard: Must be approved and paid at registration desk
      const isApproved =
        member.delegation.paymentStatus === "PAID" ||
        member.delegation.paymentStatus === "VERIFIED" ||
        member.registrations.some((r) => r.status === "CONFIRMED");

      if (!isApproved) {
        return NextResponse.json(
          {
            success: false,
            notApproved: true,
            paymentPending: true,
            message: `QR code is valid, but NOT APPROVED: ${member.name}'s registration (${member.delegation.collegeName}) has not been approved at the Registration Desk yet. Please approve the registration and collect the fee (₹${member.delegation.totalFee || 0}) before entry.`,
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
            isExpired: true,
            message: `QR Code Expired / Already Scanned: ${member.name} (${member.delegation.collegeName}) was already checked in for "${targetEvent.name}" on ${
              reg.checkedInAt
                ? new Date(reg.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                : "earlier today"
            } by ${reg.checkedInBy || "Coordinator"}. This single-use QR pass has expired.`,
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
      if (session.user.role === "FOOD_COORDINATOR") {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized: Food Committee coordinators cannot alter competition event attendance.",
          },
          { status: 403 }
        );
      }
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
      if (session.user.role !== "ADMIN" && session.user.role !== "FOOD_COORDINATOR") {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized: Event Coordinators cannot scan or approve food tokens. Food distribution is strictly restricted to the Food Committee.",
          },
          { status: 403 }
        );
      }

      // Pass Type Guard: Must be a Food Token QR
      if (member.badgeCode.toUpperCase() === code.toUpperCase() && member.foodTokenCode.toUpperCase() !== code.toUpperCase()) {
        return NextResponse.json(
          {
            success: false,
            isWrongType: true,
            message: `Wrong Pass Scanned: Scanned code "${code}" is an Event Registration Pass QR. Food distribution requires the participant's Food Token QR (${member.foodTokenCode}). Event passes cannot be scanned for meals.`,
          },
          { status: 400 }
        );
      }

      const isApproved =
        member.delegation.paymentStatus === "PAID" ||
        member.delegation.paymentStatus === "VERIFIED" ||
        member.registrations.some((r) => r.status === "CONFIRMED");

      if (!isApproved) {
        return NextResponse.json(
          {
            success: false,
            notApproved: true,
            paymentPending: true,
            foodPreference: (member as any).foodPreference || "VEG",
            message: `QR code is valid, but NOT APPROVED: Meal token cannot be issued because ${member.name}'s registration (${member.delegation.collegeName}) has not been approved at the Registration Desk.`,
          },
          { status: 403 }
        );
      }

      if (member.foodTokenClaimed) {
        return NextResponse.json(
          {
            success: false,
            alreadyClaimed: true,
            isExpired: true,
            foodPreference: (member as any).foodPreference || "VEG",
            message: `QR Token Expired / Already Redeemed: Food token was ALREADY claimed by ${member.name} (${member.delegation.collegeName}) on ${
              member.foodClaimedAt
                ? new Date(member.foodClaimedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "earlier today"
            } (Verified by ${member.foodClaimedBy || "staff"}). Tokens are single-use.`,
            member: {
              ...member,
              foodPreference: (member as any).foodPreference || "VEG",
            },
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

      const pref = (member as any).foodPreference || "VEG";

      await logActivity({
        action: "FOOD_TOKEN_CLAIMED",
        actorId: session.user.id,
        actorName,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Registration",
        targetId: member.id,
        targetTitle: `Food Issued: ${member.name} [${pref}] (${member.foodTokenCode})`,
        details: {
          foodTokenCode: member.foodTokenCode,
          badgeCode: member.badgeCode,
          studentName: member.name,
          college: member.delegation.collegeName,
          foodPreference: pref,
        },
      });

      return NextResponse.json({
        success: true,
        foodPreference: pref,
        message: `Meal successfully issued to ${member.name} (${pref === "VEG" ? "🥗 VEG" : "🍗 NON-VEG"})!`,
        member: {
          ...member,
          foodPreference: pref,
          foodTokenClaimed: true,
          foodClaimedAt: updated.foodClaimedAt,
          foodClaimedBy: updated.foodClaimedBy,
        },
      });
    }

    if (action === "FOOD_UNCLAIM") {
      if (session.user.role !== "ADMIN" && session.user.role !== "FOOD_COORDINATOR") {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized: Food claim reversal is restricted to the Food Committee and Administrators.",
          },
          { status: 403 }
        );
      }

      const updated = await prisma.delegationMember.update({
        where: { id: member.id },
        data: {
          foodTokenClaimed: false,
          foodClaimedAt: null,
          foodClaimedBy: null,
        },
      });

      const pref = (member as any).foodPreference || "VEG";

      await logActivity({
        action: "FOOD_TOKEN_REVERTED",
        actorId: session.user.id,
        actorName,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Registration",
        targetId: member.id,
        targetTitle: `Food Claim Reverted: ${member.name} (${member.foodTokenCode})`,
        details: {
          foodTokenCode: member.foodTokenCode,
          studentName: member.name,
        },
      });

      return NextResponse.json({
        success: true,
        foodPreference: pref,
        message: `Food claim status reset to Unclaimed for ${member.name}.`,
        member: {
          ...member,
          foodPreference: pref,
          foodTokenClaimed: false,
          foodClaimedAt: null,
          foodClaimedBy: null,
        },
      });
    }

    if (action === "UPDATE_FOOD_PREFERENCE") {
      if (session.user.role !== "ADMIN" && session.user.role !== "FOOD_COORDINATOR") {
        return NextResponse.json(
          { success: false, message: "Unauthorized: Food Committee or Admin login required." },
          { status: 403 }
        );
      }

      const newPref = body.preference === "NON_VEG" ? "NON_VEG" : "VEG";
      const updated = await prisma.delegationMember.update({
        where: { id: member.id },
        data: {
          foodPreference: newPref,
        },
      });

      if (member.email) {
        await prisma.user.updateMany({
          where: { email: { equals: member.email, mode: "insensitive" } },
          data: { foodPreference: newPref },
        }).catch(() => {});
      }

      await logActivity({
        action: "UPDATE_FOOD_PREFERENCE",
        actorId: session.user.id,
        actorName,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Registration",
        targetId: member.id,
        targetTitle: `Food Preference updated: ${member.name} -> ${newPref}`,
        details: {
          oldPreference: (member as any).foodPreference,
          newPreference: newPref,
          studentName: member.name,
        },
      });

      return NextResponse.json({
        success: true,
        foodPreference: newPref,
        message: `Dietary preference updated for ${member.name} to ${newPref === "VEG" ? "Vegetarian (🥗)" : "Non-Vegetarian (🍗)"}.`,
        member: {
          ...member,
          foodPreference: newPref,
          foodTokenClaimed: updated.foodTokenClaimed,
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
