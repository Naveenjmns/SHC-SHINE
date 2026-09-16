import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { buildSecureErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

// GET: Retrieve current email notification trigger policies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const setting = await prisma.smtpSetting.findUnique({
      where: { id: "default" },
    }) as any;

    const emailTriggers = {
      emailServiceEnabled: setting ? setting.emailServiceEnabled !== false : true,
      sendOnRegistration: setting ? setting.sendOnRegistration === true : false,
      sendOnCoordinatorAlert: setting ? setting.sendOnCoordinatorAlert !== false : true,
      sendOnApproval: setting ? setting.sendOnApproval !== false : true,
      sendOnTeamLeadApproval: setting ? setting.sendOnTeamLeadApproval !== false : true,
      sendOnEventReminder: setting ? setting.sendOnEventReminder !== false : true,
    };

    return NextResponse.json({ success: true, emailTriggers });
  } catch (error: any) {
    const secureError = buildSecureErrorResponse(error, "GET /api/admin/smtp/triggers", "Failed to retrieve email triggers");
    return NextResponse.json({ success: false, error: secureError.message }, { status: 500 });
  }
}

// POST: Update email notification trigger policies
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { emailTriggers } = body;

    if (!emailTriggers || typeof emailTriggers !== "object") {
      return NextResponse.json({ success: false, error: "Invalid email triggers payload" }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (typeof emailTriggers.emailServiceEnabled === "boolean") {
      dataToUpdate.emailServiceEnabled = emailTriggers.emailServiceEnabled;
    }
    if (typeof emailTriggers.sendOnRegistration === "boolean") {
      dataToUpdate.sendOnRegistration = emailTriggers.sendOnRegistration;
    }
    if (typeof emailTriggers.sendOnCoordinatorAlert === "boolean") {
      dataToUpdate.sendOnCoordinatorAlert = emailTriggers.sendOnCoordinatorAlert;
    }
    if (typeof emailTriggers.sendOnApproval === "boolean") {
      dataToUpdate.sendOnApproval = emailTriggers.sendOnApproval;
    }
    if (typeof emailTriggers.sendOnTeamLeadApproval === "boolean") {
      dataToUpdate.sendOnTeamLeadApproval = emailTriggers.sendOnTeamLeadApproval;
    }
    if (typeof emailTriggers.sendOnEventReminder === "boolean") {
      dataToUpdate.sendOnEventReminder = emailTriggers.sendOnEventReminder;
    }

    const updated = await prisma.smtpSetting.upsert({
      where: { id: "default" },
      update: dataToUpdate,
      create: {
        id: "default",
        ...dataToUpdate,
      },
    }) as any;

    await logActivity({
      action: "EMAIL_TRIGGERS_UPDATED",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "System",
      targetId: "email-triggers",
      targetTitle: `Email Trigger Policies Updated by ${session.user.name}`,
      details: {
        emailServiceEnabled: updated.emailServiceEnabled,
        sendOnRegistration: updated.sendOnRegistration,
        sendOnCoordinatorAlert: updated.sendOnCoordinatorAlert,
        sendOnApproval: updated.sendOnApproval,
        sendOnTeamLeadApproval: updated.sendOnTeamLeadApproval,
        sendOnEventReminder: updated.sendOnEventReminder,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Email trigger policies updated successfully",
      emailTriggers: {
        emailServiceEnabled: updated.emailServiceEnabled !== false,
        sendOnRegistration: updated.sendOnRegistration === true,
        sendOnCoordinatorAlert: updated.sendOnCoordinatorAlert !== false,
        sendOnApproval: updated.sendOnApproval !== false,
        sendOnTeamLeadApproval: updated.sendOnTeamLeadApproval !== false,
        sendOnEventReminder: updated.sendOnEventReminder !== false,
      },
    });
  } catch (error: any) {
    const secureError = buildSecureErrorResponse(error, "POST /api/admin/smtp/triggers", "Failed to update email triggers");
    return NextResponse.json({ success: false, error: secureError.message }, { status: 500 });
  }
}
