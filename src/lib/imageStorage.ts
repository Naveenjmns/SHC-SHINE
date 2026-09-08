import fs from "fs";
import path from "path";
import crypto from "crypto";
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

export async function saveImageToStore(
  buffer: Buffer,
  mimeType: string = "image/png",
  originalName?: string
): Promise<string> {
  const normalizedMime = mimeType ? mimeType.toLowerCase().split(";")[0].trim() : "image/png";
  const ext = MIME_TO_EXT[normalizedMime] || ".png";

  // SHA-256 hash for deterministic deduplication
  const hash = crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 24);
  const filename = `img_${hash}${ext}`;
  const uint8Data = new Uint8Array(buffer);

  // 1. Persist binary bytes in PostgreSQL ImageStore table
  await prisma.imageStore.upsert({
    where: { filename },
    update: {
      data: uint8Data,
      mimeType: normalizedMime,
      size: buffer.length,
    },
    create: {
      filename,
      mimeType: normalizedMime,
      data: uint8Data,
      size: buffer.length,
    },
  });

  // 2. Cache copy on local disk if directory writable
  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, buffer);
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
