import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getImageByFilename } from "@/lib/imageStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".avif": "image/avif",
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const params = await Promise.resolve(context.params);
    const pathSegments = params?.path;

    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Security check to prevent directory traversal
    const safeSubPath = path.normalize(path.join(...pathSegments)).replace(/^(\.\.[\/\\])+/, "");
    
    // Check in public/uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const fullPath = path.join(uploadsDir, safeSubPath);

    // Verify file stays within uploadsDir
    if (!fullPath.startsWith(uploadsDir)) {
      return new NextResponse("Access Denied", { status: 403 });
    }

    const filename = path.basename(safeSubPath);
    const result = await getImageByFilename(filename);

    if (!result) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error serving upload file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
