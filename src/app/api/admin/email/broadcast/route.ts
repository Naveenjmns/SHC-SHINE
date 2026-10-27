import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendBroadcastEmail } from "@/lib/emailService";
import { getActiveEdition } from "@/lib/eventService";
import { logActivity } from "@/lib/activityLogger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, message, targetAudience = "ALL", targetEventId } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: "Subject and Message body are required" },
        { status: 400 }
      );
    }

    const activeEdition = await getActiveEdition();
    const eventName = `${activeEdition.name} ${activeEdition.edition}`;
    const institutionName = activeEdition.institutionName || "College Event Organizing Committee";

    // Collect recipient students
    let recipients: { email: string; name: string }[] = [];

    if (targetAudience === "EVENT" && !targetEventId) {
      // Never fall through to "everyone" when an event-specific send is missing its event
      return NextResponse.json(
        { success: false, error: "Select the event whose participants should receive this broadcast." },
        { status: 400 }
      );
    }

    if (targetAudience === "EVENT") {
      const registrations = await prisma.registration.findMany({
        where: { eventId: targetEventId, status: { not: "REJECTED" } },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });

      // Deduplicate by email
      const emailMap = new Map<string, string>();
      for (const reg of registrations) {
        if (reg.user?.email) {
          emailMap.set(reg.user.email, reg.user.name || "Student Delegate");
        }
      }

      recipients = Array.from(emailMap.entries()).map(([email, name]) => ({ email, name }));
    } else {
      // All non-rejected participants of the active edition
      const registrations = await prisma.registration.findMany({
        where: {
          status: { not: "REJECTED" },
          ...(activeEdition.id && activeEdition.id !== "default-shine" ? { event: { editionId: activeEdition.id } } : {}),
        },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });

      const emailMap = new Map<string, string>();
      for (const reg of registrations) {
        if (reg.user?.email) {
          emailMap.set(reg.user.email, reg.user.name || "Student Delegate");
        }
      }

      recipients = Array.from(emailMap.entries()).map(([email, name]) => ({ email, name }));
    }

    if (recipients.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No registered student recipients found for this target audience.",
      }, { status: 400 });
    }

    // Record the broadcast first, then send in the background. Sending one email at a time can
    // outlast the request timeout on large lists, and a timed-out request used to leave no record,
    // so a retry re-sent to everyone already reached. The status is updated when sending finishes.
    const broadcastRecord = await prisma.emailBroadcast.create({
      data: {
        subject,
        message,
        targetAudience,
        targetEventId: targetAudience === "EVENT" ? targetEventId : null,
        recipientCount: 0,
        status: "SENDING",
        sentBy: session.user.email,
      },
    });

    const actor = {
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
    };

    void (async () => {
      let successCount = 0;
      let failureCount = recipients.length;
      try {
        const dispatchResults = await sendBroadcastEmail({ recipients, subject, message, eventName, institutionName });
        successCount = dispatchResults.filter((r) => r.success).length;
        failureCount = dispatchResults.length - successCount;
      } catch (err) {
        console.error("Broadcast dispatch error:", err);
      }
      const status = failureCount === 0 ? "SENT" : successCount > 0 ? "PARTIAL" : "FAILED";
      try {
        await prisma.emailBroadcast.update({
          where: { id: broadcastRecord.id },
          data: { recipientCount: successCount, status },
        });
        await logActivity({
          action: "EMAIL_BROADCAST",
          ...actor,
          targetType: "Email",
          targetId: broadcastRecord.id,
          targetTitle: `Broadcast: "${subject}" (${successCount} delivered)`,
          details: { subject, targetAudience, recipientCount: recipients.length, delivered: successCount, failed: failureCount, status },
        });
      } catch (err) {
        console.error("Broadcast bookkeeping error:", err);
      }
    })();

    return NextResponse.json(
      {
        success: true,
        broadcast: broadcastRecord,
        recipientCount: recipients.length,
        message: `Broadcast queued for ${recipients.length} recipient(s). Delivery status will appear in the broadcast history.`,
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/email/broadcast error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
