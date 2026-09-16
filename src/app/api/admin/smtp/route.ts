import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { encryptSecret, decryptSecret, buildSecureErrorResponse } from "@/lib/security";
import { isGmailApiConfigured } from "@/lib/emailService";

export const dynamic = "force-dynamic";

// GET: Retrieve SMTP Configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const gmailConfigured = isGmailApiConfigured();
    const gmailUser = process.env.GMAIL_USER || null;

    const setting = await prisma.smtpSetting.findUnique({
      where: { id: "default" },
    });

    const defaultTriggers = {
      emailServiceEnabled: true,
      sendOnRegistration: false,
      sendOnCoordinatorAlert: true,
      sendOnApproval: true,
      sendOnTeamLeadApproval: true,
      sendOnEventReminder: true,
    };

    if (!setting) {
      return NextResponse.json({
        success: true,
        isGmailApiConfigured: gmailConfigured,
        gmailUser,
        emailTriggers: defaultTriggers,
        smtp: {
          host: process.env.SMTP_HOST || (gmailConfigured ? "gmail.googleapis.com (REST API)" : ""),
          port: 465,
          secure: true,
          user: process.env.SMTP_USER || gmailUser || "",
          hasPassword: !!process.env.SMTP_PASSWORD,
          fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || gmailUser || "",
          fromName: process.env.SMTP_FROM_NAME || "Event Coordination Team",
          replyTo: process.env.SMTP_REPLY_TO || "",
        },
      });
    }

    const s = setting as any;
    return NextResponse.json({
      success: true,
      isGmailApiConfigured: gmailConfigured,
      gmailUser,
      emailTriggers: {
        emailServiceEnabled: s.emailServiceEnabled !== false,
        sendOnRegistration: s.sendOnRegistration === true,
        sendOnCoordinatorAlert: s.sendOnCoordinatorAlert !== false,
        sendOnApproval: s.sendOnApproval !== false,
        sendOnTeamLeadApproval: s.sendOnTeamLeadApproval !== false,
        sendOnEventReminder: s.sendOnEventReminder !== false,
      },
      smtp: {
        host: setting.host,
        port: 465,
        secure: true,
        user: setting.user,
        hasPassword: !!setting.password,
        fromEmail: setting.fromEmail,
        fromName: setting.fromName,
        replyTo: setting.replyTo || "",
      },
    });
  } catch (error: any) {
    const secureError = buildSecureErrorResponse(error, "GET /api/admin/smtp", "Failed to load SMTP settings.");
    return NextResponse.json({ success: false, error: secureError.message }, { status: 500 });
  }
}

// POST: Save/Update SMTP Configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { host, user, password, fromEmail, fromName, replyTo, emailTriggers } = body;

    const existing = await prisma.smtpSetting.findUnique({
      where: { id: "default" },
    });

    const dataToSave: any = {
      host: host || "",
      port: 465,
      secure: true,
      user: user || "",
      fromEmail: fromEmail || user || "",
      fromName: fromName || "Event Coordination Team",
      replyTo: replyTo || null,
    };

    if (emailTriggers) {
      if (typeof emailTriggers.emailServiceEnabled === "boolean") dataToSave.emailServiceEnabled = emailTriggers.emailServiceEnabled;
      if (typeof emailTriggers.sendOnRegistration === "boolean") dataToSave.sendOnRegistration = emailTriggers.sendOnRegistration;
      if (typeof emailTriggers.sendOnCoordinatorAlert === "boolean") dataToSave.sendOnCoordinatorAlert = emailTriggers.sendOnCoordinatorAlert;
      if (typeof emailTriggers.sendOnApproval === "boolean") dataToSave.sendOnApproval = emailTriggers.sendOnApproval;
      if (typeof emailTriggers.sendOnTeamLeadApproval === "boolean") dataToSave.sendOnTeamLeadApproval = emailTriggers.sendOnTeamLeadApproval;
      if (typeof emailTriggers.sendOnEventReminder === "boolean") dataToSave.sendOnEventReminder = emailTriggers.sendOnEventReminder;
    }

    // If password provided and not masked placeholder
    if (password && password !== "••••••••" && password !== "******") {
      // SECURITY: Encrypt the password before storing in the database
      dataToSave.password = encryptSecret(password);
    } else if (!existing) {
      dataToSave.password = "";
    }

    const updated = await prisma.smtpSetting.upsert({
      where: { id: "default" },
      update: dataToSave,
      create: {
        id: "default",
        ...dataToSave,
        password: dataToSave.password || "",
      },
    }) as any;

    await logActivity({
      action: "SMTP_SETTINGS_UPDATED",
      actorId: session.user.id,
      actorName: session.user.name,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      targetType: "System",
      targetId: "smtp",
      targetTitle: `SMTP Config: ${updated.host}:${updated.port} (${updated.fromEmail})`,
      details: {
        host: updated.host,
        port: updated.port,
        secure: updated.secure,
        fromEmail: updated.fromEmail,
        fromName: updated.fromName,
        emailTriggers: {
          emailServiceEnabled: updated.emailServiceEnabled,
          sendOnRegistration: updated.sendOnRegistration,
          sendOnCoordinatorAlert: updated.sendOnCoordinatorAlert,
          sendOnApproval: updated.sendOnApproval,
          sendOnTeamLeadApproval: updated.sendOnTeamLeadApproval,
          sendOnEventReminder: updated.sendOnEventReminder,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "SMTP settings saved successfully",
      emailTriggers: {
        emailServiceEnabled: updated.emailServiceEnabled !== false,
        sendOnRegistration: updated.sendOnRegistration === true,
        sendOnCoordinatorAlert: updated.sendOnCoordinatorAlert !== false,
        sendOnApproval: updated.sendOnApproval !== false,
        sendOnTeamLeadApproval: updated.sendOnTeamLeadApproval !== false,
        sendOnEventReminder: updated.sendOnEventReminder !== false,
      },
      smtp: {
        host: updated.host,
        port: updated.port,
        secure: updated.secure,
        user: updated.user,
        hasPassword: !!updated.password,
        fromEmail: updated.fromEmail,
        fromName: updated.fromName,
        replyTo: updated.replyTo || "",
      },
    });
  } catch (error: any) {
    const secureError = buildSecureErrorResponse(error, "POST /api/admin/smtp", "Failed to save SMTP settings.");
    return NextResponse.json({ success: false, error: secureError.message }, { status: 500 });
  }
}
