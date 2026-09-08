import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import prisma from "@/lib/prisma";

const MIME_TO_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

// Formats that sharp can convert to WebP
const CONVERTIBLE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/avif",
  "image/tiff",
]);

// Maximum dimensions for stored images.
// Images larger than this will be resized proportionally.
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
// WebP quality (0-100). 80 is a good balance of quality and file size.
const WEBP_QUALITY = 80;

/**
 * Optimize an image buffer: convert to WebP and resize if oversized.
 * SVGs and GIFs are returned as-is since they don't benefit from WebP conversion.
 * Returns { buffer, mimeType, ext } with the optimized image.
 */
async function optimizeImage(
  inputBuffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
  const normalizedMime = mimeType.toLowerCase().split(";")[0].trim();

  // Skip optimization for SVGs, GIFs, and non-convertible formats
  if (!CONVERTIBLE_MIMES.has(normalizedMime)) {
    const ext = MIME_TO_EXT[normalizedMime] || ".png";
    return { buffer: inputBuffer, mimeType: normalizedMime, ext };
  }

  try {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    // Determine if resize is needed
    const needsResize =
      (metadata.width && metadata.width > MAX_WIDTH) ||
      (metadata.height && metadata.height > MAX_HEIGHT);

    let pipeline = image;

    if (needsResize) {
      pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "inside", // Maintain aspect ratio, fit within bounds
        withoutEnlargement: true, // Never upscale
      });
    }

    // Convert to WebP
    const optimizedBuffer = await pipeline
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    return {
      buffer: optimizedBuffer,
      mimeType: "image/webp",
      ext: ".webp",
    };
  } catch (err) {
    // If sharp fails (e.g. corrupted image), fall back to original
    console.warn("Image optimization failed, storing original:", err);
    const ext = MIME_TO_EXT[normalizedMime] || ".png";
    return { buffer: inputBuffer, mimeType: normalizedMime, ext };
  }
}

export async function saveImageToStore(
  buffer: Buffer,
  mimeType: string = "image/png",
  originalName?: string
): Promise<string> {
  // Optimize the image (WebP conversion + resize)
  const optimized = await optimizeImage(buffer, mimeType);

  // SHA-256 hash of the OPTIMIZED buffer for deterministic deduplication
  const hash = crypto
    .createHash("sha256")
    .update(optimized.buffer)
    .digest("hex")
    .slice(0, 24);
  const filename = `img_${hash}${optimized.ext}`;
  const uint8Data = new Uint8Array(optimized.buffer);

  // 1. Persist binary bytes in PostgreSQL ImageStore table
  await prisma.imageStore.upsert({
    where: { filename },
    update: {
      data: uint8Data,
      mimeType: optimized.mimeType,
      size: optimized.buffer.length,
    },
    create: {
      filename,
      mimeType: optimized.mimeType,
      data: uint8Data,
      size: optimized.buffer.length,
    },
  });

  // 2. Cache copy on local disk if directory writable
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, optimized.buffer);
  } catch (err) {
    console.warn("Notice: Local disk cache write skipped:", err);
  }

  return `/uploads/${filename}`;
}

export async function getImageByFilename(
  filename: string
): Promise<{ data: Buffer; mimeType: string } | null> {
  const sanitizeFilename = path.basename(filename);
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const localPath = path.join(uploadsDir, sanitizeFilename);

  // 1. Try serving from local disk cache
  if (fs.existsSync(localPath)) {
    try {
      const data = await fs.promises.readFile(localPath);
      const ext = path.extname(sanitizeFilename).toLowerCase();
      const mimeType = EXT_TO_MIME[ext] || "image/png";
      return { data, mimeType };
    } catch {
      // Fall through to DB
    }
  }

  // 2. Fallback to PostgreSQL ImageStore (survives Railway restarts)
  const record = await prisma.imageStore.findUnique({
    where: { filename: sanitizeFilename },
  });

  if (!record || !record.data) {
    return null;
  }

  const data = Buffer.from(record.data);

  // Restore file to local disk cache for fast future reads
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    await fs.promises.writeFile(localPath, data);
  } catch {
    // Ignore cache write errors
  }

  return {
    data,
    mimeType: record.mimeType || "image/png",
  };
}
