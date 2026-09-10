import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activityLogger";
import { encryptSecret, decryptSecret, buildSecureErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

// GET: Retrieve SMTP Configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const setting = await prisma.smtpSetting.findUnique({
      where: { id: "default" },
    });

    if (!setting) {
      return NextResponse.json({
        success: true,
        smtp: {
          host: process.env.SMTP_HOST || "",
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: process.env.SMTP_SECURE === "true",
          user: process.env.SMTP_USER || "",
          hasPassword: !!process.env.SMTP_PASSWORD,
          fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
          fromName: process.env.SMTP_FROM_NAME || "Event Coordination Team",
          replyTo: process.env.SMTP_REPLY_TO || "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      smtp: {
        host: setting.host,
        port: setting.port,
        secure: setting.secure,
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
    const { host, port, secure, user, password, fromEmail, fromName, replyTo } = body;

    const existing = await prisma.smtpSetting.findUnique({
      where: { id: "default" },
    });

    const dataToSave: any = {
      host: host || "",
      port: parseInt(port || "587", 10),
      secure: !!secure,
      user: user || "",
      fromEmail: fromEmail || user || "",
      fromName: fromName || "Event Coordination Team",
      replyTo: replyTo || null,
    };

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
    });

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
      },
    });

    return NextResponse.json({
      success: true,
      message: "SMTP settings saved successfully",
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
