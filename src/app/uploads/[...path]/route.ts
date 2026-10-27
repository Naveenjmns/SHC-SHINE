import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getImageByFilename } from "@/lib/imageStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

let sharpInstance: any = null;
async function getSharp() {
  if (sharpInstance !== null) return sharpInstance;
  try {
    const mod = await import("sharp");
    sharpInstance = mod.default || mod;
    return sharpInstance;
  } catch (err) {
    console.warn("Sharp is not available in uploads route:", err);
    sharpInstance = false;
    return false;
  }
}

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
  "image/webp", // re-encoded only when a resize is requested
]);

// WebP quality for on-the-fly conversion
const WEBP_QUALITY = 80;

// Allowed resize targets for ?w= / ?h=
const ALLOWED_DIMENSIONS = [64, 128, 256, 384, 512, 768, 1024, 1280, 1920];

function snapDimension(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const requested = parseInt(raw, 10);
  if (!Number.isFinite(requested) || requested <= 0) return undefined;
  return ALLOWED_DIMENSIONS.find((d) => d >= requested) ?? ALLOWED_DIMENSIONS[ALLOWED_DIMENSIONS.length - 1];
}

// SVGs are active documents: if opened directly they must not be able to run script
const SVG_SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
  "X-Content-Type-Options": "nosniff",
};

function responseHeaders(mimeType: string): Record<string, string> {
  return {
    "Content-Type": mimeType,
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    ...(mimeType === "image/svg+xml" ? SVG_SECURITY_HEADERS : {}),
  };
}

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
    const sharp = await getSharp();
    if (!sharp) {
      return { buffer: data, mimeType };
    }

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
    const relative = path.relative(uploadsDir, fullPath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      return new NextResponse("Access Denied", { status: 403 });
    }

    const filename = path.basename(safeSubPath);
    
    // Parse optional resize query params: ?w=256&h=256
    const url = new URL(req.url);
    const wParam = url.searchParams.get("w");
    const hParam = url.searchParams.get("h");
    // SECURITY: Snap requested sizes to a fixed set so the on-disk cache cannot grow without bound
    const maxWidth = snapDimension(wParam);
    const maxHeight = snapDimension(hParam);

    // Check if we have a cached optimized version on disk
    const ext = path.extname(filename).toLowerCase();
    const isAlreadyWebP = ext === ".webp";
    const isResize = Boolean(maxWidth || maxHeight);
    // Convert non-WebP rasters to WebP; WebP files are only re-encoded when resized
    const needsOptimization = OPTIMIZABLE_MIMES.has(MIME_TYPES[ext] || "") && (!isAlreadyWebP || isResize);

    // Every optimized variant gets its own cache name (size suffix), never the original's name
    const cacheFilename = `${path.basename(filename, ext)}${isResize ? `_${maxWidth || ""}x${maxHeight || ""}` : ""}.webp`;
    const cachePath = path.join(uploadsDir, ".cache", cacheFilename);

    // Try serving from optimization cache first
    if (needsOptimization && fs.existsSync(cachePath)) {
      const cached = await fs.promises.readFile(cachePath);
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: responseHeaders("image/webp"),
      });
    }

    // Get the original image
    const result = await getImageByFilename(filename);

    if (!result) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    // Optimize if possible
    if (needsOptimization) {
      const optimized = await optimizeOnTheFly(
        Buffer.from(result.data),
        result.mimeType,
        maxWidth,
        maxHeight
      );

      // Cache only real WebP output: if sharp failed we got the original bytes back, and storing
      // them under a .webp name would later be served with the wrong content type
      if (optimized.mimeType === "image/webp") {
        try {
          const cacheDir = path.join(uploadsDir, ".cache");
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          await fs.promises.writeFile(cachePath, optimized.buffer);
        } catch {
          // Cache write failure is non-fatal
        }
      }

      return new NextResponse(new Uint8Array(optimized.buffer), {
        status: 200,
        headers: responseHeaders(optimized.mimeType),
      });
    }

    return new NextResponse(new Uint8Array(result.data), {
      status: 200,
      headers: responseHeaders(result.mimeType),
    });
  } catch (error: any) {
    console.error("Error serving upload file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
