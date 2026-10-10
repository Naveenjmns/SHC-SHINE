import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveUploadedFile } from "@/lib/upload";
import { saveImageToStore } from "@/lib/imageStorage";
import { buildSecureErrorResponse } from "@/lib/security";
import { sanitizeSvg, extractZonesFromSvg } from "@/lib/svgSanitizer";

export const dynamic = "force-dynamic";

// General image limits
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
// Strict SVG floor plan limit as specified: 2MB
const MAX_SVG_SIZE = 2 * 1024 * 1024; // 2MB

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/svg",
  "image/avif",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const isFloorPlan = formData.get("isFloorPlan") === "true";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const mimeType = (file.type || "").toLowerCase().split(";")[0].trim();
    const isSvg = fileName.endsWith(".svg") || mimeType === "image/svg+xml" || mimeType === "image/svg";

    // Strict validation for Floor Plan or SVG uploads
    if (isFloorPlan || isSvg) {
      if (!fileName.endsWith(".svg")) {
        return NextResponse.json(
          { success: false, error: "Invalid file type. Floor plans must be .svg vector files." },
          { status: 400 }
        );
      }

      if (mimeType && mimeType !== "image/svg+xml" && mimeType !== "image/svg" && mimeType !== "text/xml") {
        return NextResponse.json(
          { success: false, error: `Invalid MIME type "${mimeType}". Expected "image/svg+xml".` },
          { status: 400 }
        );
      }

      if (file.size > MAX_SVG_SIZE) {
        return NextResponse.json(
          { success: false, error: `SVG file too large. Maximum allowed size is 2MB (${(file.size / 1024 / 1024).toFixed(2)}MB uploaded).` },
          { status: 400 }
        );
      }

      // Read raw SVG text and sanitize thoroughly
      const rawSvgText = await file.text();
      const { sanitized, isValid, error: sanitizeError } = sanitizeSvg(rawSvgText);

      if (!isValid || !sanitized) {
        return NextResponse.json(
          { success: false, error: sanitizeError || "SVG failed security sanitization check." },
          { status: 400 }
        );
      }

      // Extract zones from sanitized SVG
      const zones = extractZonesFromSvg(sanitized);

      // Save sanitized SVG buffer to persistent store and disk
      const sanitizedBuffer = Buffer.from(sanitized, "utf-8");
      const fileUrl = await saveImageToStore(sanitizedBuffer, "image/svg+xml", file.name);

      return NextResponse.json({
        success: true,
        url: fileUrl,
        zones,
        zoneCount: zones.length,
      });
    }

    // Standard image upload path (PNG, JPG, WebP, etc.)
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size is ${MAX_IMAGE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type "${mimeType}". Only image files are allowed.` },
        { status: 400 }
      );
    }

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
