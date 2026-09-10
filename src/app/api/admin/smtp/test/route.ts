import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { testSmtpConnection } from "@/lib/emailService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const testEmail = body.testEmail || session.user.email;

    if (!testEmail) {
      return NextResponse.json(
        { success: false, error: "Test recipient email address is required" },
        { status: 400 }
      );
    }

    const result = await testSmtpConnection(testEmail);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/admin/smtp/test error:", error);
    return NextResponse.json({ success: false, message: "Failed to test SMTP connection." }, { status: 500 });
  }
}
