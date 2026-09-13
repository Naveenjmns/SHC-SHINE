import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RegistrationStatus } from "@prisma/client";

// GET /api/admin/registrations - List all registrations across the fest
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: {
      eventId?: string;
      status?: RegistrationStatus;
      user?: {
        OR?: Array<{
          name?: { contains: string; mode: "insensitive" };
          email?: { contains: string; mode: "insensitive" };
          college?: { contains: string; mode: "insensitive" };
        }>;
      };
    } = {};

    if (eventId) {
      where.eventId = eventId;
    }

    if (status && Object.values(RegistrationStatus).includes(status as RegistrationStatus)) {
      where.status = status as RegistrationStatus;
    }

    if (search) {
      const s = search.trim();
      where.user = {
        OR: [
          { name: { contains: s, mode: "insensitive" } },
          { email: { contains: s, mode: "insensitive" } },
          { college: { contains: s, mode: "insensitive" } },
        ],
      };
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            college: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            category: true,
            fee: true,
            venue: true,
            coordinator: {
              select: {
                name: true,
              },
            },
          },
        },
        delegation: {
          select: {
            id: true,
            collegeName: true,
            teamName: true,
            teamLeadName: true,
            teamLeadEmail: true,
            teamLeadPhone: true,
            staffInchargeName: true,
            totalFee: true,
            paymentStatus: true,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, registrations });
  } catch (error) {
    console.error("Error fetching all registrations:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch registrations." }, { status: 500 });
  }
}

// PATCH /api/admin/registrations - Admin can approve registrations or collect payment for entire delegation
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized. Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { registrationId, delegationId, action, status, result, score } = body;

    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const origin = `${protocol}://${hostHeader}`;

    // Handle College / Delegation Batch Approval & Rejection
    if (action === "REJECT_COLLEGE") {
      const collegeName = body.collegeName;
      if (delegationId) {
        await prisma.delegation.update({
          where: { id: delegationId },
          data: { paymentStatus: "REJECTED" },
        });
        await prisma.registration.updateMany({
          where: { delegationId },
          data: { status: RegistrationStatus.REJECTED, prelimsStatus: null, result: null },
        });
      } else if (collegeName) {
        const users = await prisma.user.findMany({
          where: { college: { equals: collegeName.trim(), mode: "insensitive" } },
          select: { id: true },
        });
        const userIds = users.map((u) => u.id);
        await prisma.registration.updateMany({
          where: { userId: { in: userIds } },
          data: { status: RegistrationStatus.REJECTED, prelimsStatus: null, result: null },
        });
      }
      return NextResponse.json({ success: true, message: `Registrations for ${collegeName || "this college"} have been REJECTED.` });
    }

    if (action === "COLLECT_PAYMENT_APPROVE_DELEGATION" || action === "APPROVE_COLLEGE" || (delegationId && action === "APPROVE")) {
      const collegeName = body.collegeName;
      if (!delegationId && collegeName) {
        // Direct individual registrants grouped by college
        const users = await prisma.user.findMany({
          where: { college: { equals: collegeName.trim(), mode: "insensitive" } },
          select: { id: true },
        });
        const userIds = users.map((u) => u.id);
        await prisma.registration.updateMany({
          where: { userId: { in: userIds } },
          data: { status: RegistrationStatus.CONFIRMED },
        });
        return NextResponse.json({ success: true, message: `All student registrations for ${collegeName} have been APPROVED!` });
      }

      if (!delegationId) {
        return NextResponse.json({ success: false, message: "Delegation ID or College Name is required." }, { status: 400 });
      }

      const delegation = await prisma.delegation.findUnique({
        where: { id: delegationId },
        include: {
          members: {
            include: {
              registrations: {
                include: {
                  event: true,
                },
              },
            },
          },
        },
      });

      if (!delegation) {
        return NextResponse.json({ success: false, message: "Delegation not found." }, { status: 404 });
      }

      // Mark delegation payment as PAID
      await prisma.delegation.update({
        where: { id: delegationId },
        data: { paymentStatus: "PAID" },
      });

      // Mark all registrations of this delegation as CONFIRMED
      await prisma.registration.updateMany({
        where: { delegationId },
        data: { status: RegistrationStatus.CONFIRMED },
      });

      // Dispatch individual approved pass emails to all delegates
      const memberRoster = [];
      const { sendApprovedDelegatePassEmail, sendTeamLeadConsolidatedPassEmail } = await import("@/lib/emailService");

      for (const member of delegation.members) {
        const memberEvents = member.registrations.map((r) => ({
          name: r.event.name,
          category: r.event.category,
          venue: r.event.venue,
          time: r.event.dateTime ? new Date(r.event.dateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null,
        }));

        const badgeUrl = `${origin}/badge/${member.badgeCode}`;

        memberRoster.push({
          name: member.name,
          email: member.email,
          phone: member.phone,
          isTeamLead: member.isTeamLead,
          badgeCode: member.badgeCode,
          foodTokenCode: member.foodTokenCode,
          badgeUrl,
          events: memberEvents,
        });

        // Send individual approved pass email with portal credentials
        sendApprovedDelegatePassEmail({
          toEmail: member.email,
          delegateName: member.name,
          collegeName: delegation.collegeName,
          teamName: delegation.teamName,
          badgeCode: member.badgeCode,
          foodTokenCode: member.foodTokenCode,
          badgeUrl,
          portalUrl: `${origin}/login`,
          userId: member.email,
          password: member.phone || "Your registered mobile number",
          userPhone: member.phone,
          events: memberEvents,
        }).catch((err) => console.error(`Failed to send approved pass to ${member.email}:`, err));
      }

      // Send consolidated team dossier email to Team Lead
      sendTeamLeadConsolidatedPassEmail({
        teamLeadEmail: delegation.teamLeadEmail,
        teamLeadName: delegation.teamLeadName,
        collegeName: delegation.collegeName,
        teamName: delegation.teamName,
        totalFee: delegation.totalFee,
        members: memberRoster,
      }).catch((err) => console.error(`Failed to send team lead dossier to ${delegation.teamLeadEmail}:`, err));

      const { logActivity } = await import("@/lib/activityLogger");
      await logActivity({
        action: "REGISTRATION_DESK_PAYMENT_COLLECTED",
        actorId: session.user.id,
        actorName: session.user.name || "Registration Desk Admin",
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Delegation",
        targetId: delegation.id,
        targetTitle: `Payment Collected & Approved: ${delegation.collegeName} (${delegation.teamName || "Delegation"})`,
        details: {
          delegationId: delegation.id,
          collegeName: delegation.collegeName,
          totalFee: delegation.totalFee,
          memberCount: delegation.members.length,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Payment collected (₹${delegation.totalFee}) and all ${delegation.members.length} delegate passes approved! Emails dispatched to students and team lead.`,
      });
    }

    if (!registrationId) {
      return NextResponse.json({ success: false, message: "Registration ID is required." }, { status: 400 });
    }

    const updateData: { status?: RegistrationStatus; result?: string | null; score?: number | null; prelimsStatus?: string | null } = {};
    if (status && Object.values(RegistrationStatus).includes(status)) {
      updateData.status = status as RegistrationStatus;
      if (status === "REJECTED") {
        updateData.prelimsStatus = null;
        updateData.result = null;
      }
    }
    if (result !== undefined) {
      updateData.result = result ? result.trim() : null;
    }
    if (score !== undefined) {
      updateData.score = score === "" || score === null ? null : parseFloat(score);
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: updateData,
      include: {
        user: true,
        event: true,
        delegation: true,
        delegationMember: true,
      },
    });

    // If marked CONFIRMED individually, send approved pass email with portal credentials
    if (status === "CONFIRMED" && updated.delegationMember) {
      const { sendApprovedDelegatePassEmail } = await import("@/lib/emailService");
      sendApprovedDelegatePassEmail({
        toEmail: updated.user.email,
        delegateName: updated.user.name,
        collegeName: updated.delegation?.collegeName || updated.user.college || "SHINE 26",
        teamName: updated.delegation?.teamName,
        badgeCode: updated.delegationMember.badgeCode,
        foodTokenCode: updated.delegationMember.foodTokenCode,
        badgeUrl: `${origin}/badge/${updated.delegationMember.badgeCode}`,
        portalUrl: `${origin}/login`,
        userId: updated.user.email,
        password: updated.user.phone || "Your registered mobile number",
        userPhone: updated.user.phone,
        events: [
          {
            name: updated.event.name,
            category: updated.event.category,
            venue: updated.event.venue,
          },
        ],
      }).catch((e) => console.error("Approved single delegate pass email error:", e));
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    console.error("Error overriding registration:", error);
    return NextResponse.json({ success: false, message: "Failed to update registration." }, { status: 500 });
  }
}
