import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";
import { buildSecureErrorResponse } from "@/lib/security";

export const dynamic = "force-dynamic";

// SECURITY: Allowed image MIME types
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

// SECURITY: Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // SECURITY: Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // SECURITY: Validate MIME type
    const mimeType = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type "${mimeType}". Only image files are allowed.` },
        { status: 400 }
      );
    }

    // SECURITY: Validate file extension
    const fileName = file.name.toLowerCase();
    const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"];
    const hasValidExtension = allowedExtensions.some((ext) => fileName.endsWith(ext));
    if (!hasValidExtension) {
      return NextResponse.json(
        { success: false, error: "Invalid file extension. Only image files are allowed." },
        { status: 400 }
      );
    }

    const fileUrl = await saveUploadedFile(file);
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    const secureError = buildSecureErrorResponse(error, "POST /api/admin/upload", "Failed to upload file.");
    return NextResponse.json({ success: false, error: secureError.message }, { status: 500 });
  }
}
