import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import sharp from "sharp";
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

// Formats that can be converted to WebP on-the-fly
const OPTIMIZABLE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/tiff",
]);

// WebP quality for on-the-fly conversion
const WEBP_QUALITY = 80;

/**
 * On-the-fly image optimization: converts PNG/JPEG to WebP,
 * optionally resizes based on query params (?w=256&h=256).
 */
async function optimizeOnTheFly(
  data: Buffer,
  mimeType: string,
  maxWidth?: number,
  maxHeight?: number
): Promise<{ buffer: Buffer; mimeType: string }> {
  // Only optimize convertible raster formats
  if (!OPTIMIZABLE_MIMES.has(mimeType)) {
    return { buffer: data, mimeType };
  }

  try {
    let pipeline = sharp(data);

    // Resize if dimensions are requested
    if (maxWidth || maxHeight) {
      pipeline = pipeline.resize(maxWidth || undefined, maxHeight || undefined, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    const optimized = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();

    return { buffer: optimized, mimeType: "image/webp" };
  } catch {
    // If optimization fails, return original
    return { buffer: data, mimeType };
  }
}

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
    const safeSubPath = path.normalize(path.join(...pathSegments)).replace(/^(\.\.[\\/\\])+/, "");
    
    // Check in public/uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const fullPath = path.join(uploadsDir, safeSubPath);

    // Verify file stays within uploadsDir
    if (!fullPath.startsWith(uploadsDir)) {
      return new NextResponse("Access Denied", { status: 403 });
    }

    const filename = path.basename(safeSubPath);
    
    // Parse optional resize query params: ?w=256&h=256
    const url = new URL(req.url);
    const wParam = url.searchParams.get("w");
    const hParam = url.searchParams.get("h");
    const maxWidth = wParam ? parseInt(wParam, 10) : undefined;
    const maxHeight = hParam ? parseInt(hParam, 10) : undefined;

    // Check if we have a cached optimized version on disk
    const ext = path.extname(filename).toLowerCase();
    const isAlreadyWebP = ext === ".webp";
    const needsOptimization = !isAlreadyWebP && OPTIMIZABLE_MIMES.has(MIME_TYPES[ext] || "");
    
    // Build cache key for optimized version
    const cacheFilename = needsOptimization
      ? `${path.basename(filename, ext)}${maxWidth || maxHeight ? `_${maxWidth || ""}x${maxHeight || ""}` : ""}.webp`
      : filename;
    const cachePath = path.join(uploadsDir, ".cache", cacheFilename);

    // Try serving from optimization cache first
    if (needsOptimization && fs.existsSync(cachePath)) {
      const cached = await fs.promises.readFile(cachePath);
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Get the original image
    const result = await getImageByFilename(filename);

    if (!result) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // Optimize if possible
    if (needsOptimization || maxWidth || maxHeight) {
      const optimized = await optimizeOnTheFly(
        Buffer.from(result.data),
        result.mimeType,
        maxWidth,
        maxHeight
      );

      // Cache the optimized version to disk for future requests
      try {
        const cacheDir = path.join(uploadsDir, ".cache");
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        await fs.promises.writeFile(cachePath, optimized.buffer);
      } catch {
        // Cache write failure is non-fatal
      }

      return new NextResponse(new Uint8Array(optimized.buffer), {
        status: 200,
        headers: {
          "Content-Type": optimized.mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
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
