import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";

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

    return NextResponse.json({
      success: true,
      typeHint,
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
        registrations: member.registrations.map((r) => ({
          registrationId: r.id,
          eventId: r.event.id,
          eventName: r.event.name,
          category: r.event.category,
          venue: r.event.venue,
          dateTime: r.event.dateTime,
          attended: r.attended,
          checkedInAt: r.checkedInAt,
          checkedInBy: r.checkedInBy,
        })),
      },
    });
  } catch (error: any) {
    console.error("GET /api/checkin error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to lookup participant." },
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

    if (action === "EVENT_CHECKIN") {
      // Mark member as checked in
      const updated = await prisma.delegationMember.update({
        where: { id: member.id },
        data: {
          eventCheckedIn: true,
          eventCheckedInAt: new Date(),
          eventCheckedInBy: actorName,
        },
      });

      // If specific eventId provided or mark all registered events
      if (eventId) {
        await prisma.registration.updateMany({
          where: {
            delegationMemberId: member.id,
            eventId: eventId,
          },
          data: {
            attended: true,
            checkedInAt: new Date(),
            checkedInBy: actorName,
          },
        });
      } else {
        await prisma.registration.updateMany({
          where: {
            delegationMemberId: member.id,
          },
          data: {
            attended: true,
            checkedInAt: new Date(),
            checkedInBy: actorName,
          },
        });
      }

      await logActivity({
        action: "DELEGATE_CHECKIN",
        actorId: session.user.id,
        actorName,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Registration",
        targetId: member.id,
        targetTitle: `Checked In: ${member.name} (${member.badgeCode})`,
        details: {
          badgeCode: member.badgeCode,
          studentName: member.name,
          college: member.delegation.collegeName,
          eventId: eventId || "ALL",
        },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully checked in ${member.name}!`,
        member: {
          ...member,
          eventCheckedIn: true,
          eventCheckedInAt: updated.eventCheckedInAt,
          eventCheckedInBy: updated.eventCheckedInBy,
        },
      });
    }

    if (action === "EVENT_UNCHECK") {
      const updated = await prisma.delegationMember.update({
        where: { id: member.id },
        data: {
          eventCheckedIn: false,
          eventCheckedInAt: null,
          eventCheckedInBy: null,
        },
      });

      await prisma.registration.updateMany({
        where: { delegationMemberId: member.id },
        data: {
          attended: false,
          checkedInAt: null,
          checkedInBy: null,
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
    console.error("POST /api/checkin error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process check-in action." },
      { status: 500 }
    );
  }
}
