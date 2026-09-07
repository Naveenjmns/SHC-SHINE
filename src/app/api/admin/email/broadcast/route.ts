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

    if (targetAudience === "EVENT" && targetEventId) {
      const registrations = await prisma.registration.findMany({
        where: { eventId: targetEventId },
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
      // All registered students (or all students in the database)
      const registrations = await prisma.registration.findMany({
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

      // If no registrations yet, also include any users with role STUDENT
      if (emailMap.size === 0) {
        const students = await prisma.user.findMany({
          where: { role: "STUDENT" },
          select: { email: true, name: true },
        });
        for (const s of students) {
          if (s.email) {
            emailMap.set(s.email, s.name || "Student Delegate");
          }
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

    // Send the broadcast emails
    const dispatchResults = await sendBroadcastEmail({
      recipients,
      subject,
      message,
      eventName,
      institutionName,
    });

    const successCount = dispatchResults.filter((r) => r.success).length;
    const failureCount = dispatchResults.filter((r) => !r.success).length;
    const status = failureCount === 0 ? "SENT" : successCount > 0 ? "PARTIAL" : "FAILED";

    // Save record to EmailBroadcast
    const broadcastRecord = await prisma.emailBroadcast.create({
      data: {
        subject,
        message,
        targetAudience,
        targetEventId: targetAudience === "EVENT" ? targetEventId : null,
        recipientCount: successCount,
        status,
        sentBy: session.user.email,
      },
    });

    await logActivity({
      action: "EMAIL_BROADCAST",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "Email",
      targetId: broadcastRecord.id,
      targetTitle: `Broadcast: "${subject}" (${successCount} delivered)`,
      details: {
        subject,
        targetAudience,
        recipientCount: recipients.length,
        delivered: successCount,
        failed: failureCount,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      broadcast: broadcastRecord,
      recipientCount: recipients.length,
      successCount,
      failureCount,
      message: `Broadcast delivered to ${successCount} out of ${recipients.length} recipients.`,
    });
  } catch (error: any) {
    console.error("POST /api/admin/email/broadcast error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
