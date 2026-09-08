/**
 * One-time migration script to re-optimize existing ImageStore records.
 * Converts PNG/JPEG images to WebP with quality 80 and resizes oversized images.
 * 
 * Usage: npx tsx scripts/optimize-existing-images.ts
 * 
 * This script is idempotent — running it multiple times is safe.
 * It skips images that are already WebP.
 */

import { PrismaClient } from "@prisma/client";
import sharp from "sharp";

const prisma = new PrismaClient();

const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1920;
const WEBP_QUALITY = 80;

const CONVERTIBLE_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/avif",
  "image/tiff",
]);

async function main() {
  console.log("=== Image Optimization Migration ===\n");

  // Fetch all image records (metadata only first to avoid loading all blobs)
  const images = await prisma.imageStore.findMany({
    select: { id: true, filename: true, mimeType: true, size: true },
  });

  console.log(`Found ${images.length} images in ImageStore.\n`);

  let skipped = 0;
  let optimized = 0;
  let failed = 0;
  let totalSavedBytes = 0;

  for (const img of images) {
    // Skip images already in WebP format
    if (img.mimeType === "image/webp" || img.filename.endsWith(".webp")) {
      console.log(`  SKIP (already WebP): ${img.filename} (${formatBytes(img.size)})`);
      skipped++;
      continue;
    }

    // Skip non-convertible formats
    if (!CONVERTIBLE_MIMES.has(img.mimeType)) {
      console.log(`  SKIP (${img.mimeType}): ${img.filename}`);
      skipped++;
      continue;
    }

    try {
      // Load the full binary data for this image
      const fullRecord = await prisma.imageStore.findUnique({
        where: { id: img.id },
        select: { data: true },
      });

      if (!fullRecord || !fullRecord.data) {
        console.log(`  SKIP (no data): ${img.filename}`);
        skipped++;
        continue;
      }

      const inputBuffer = Buffer.from(fullRecord.data);
      const originalSize = inputBuffer.length;

      // Get metadata
      const metadata = await sharp(inputBuffer).metadata();
      const dims = `${metadata.width}x${metadata.height}`;

      // Optimize: resize + convert to WebP
      const needsResize =
        (metadata.width && metadata.width > MAX_WIDTH) ||
        (metadata.height && metadata.height > MAX_HEIGHT);

      let pipeline = sharp(inputBuffer);

      if (needsResize) {
        pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }

      const optimizedBuffer = await pipeline
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const newSize = optimizedBuffer.length;
      const savings = originalSize - newSize;
      const pctSaved = ((savings / originalSize) * 100).toFixed(1);

      // Generate new filename with .webp extension
      const newFilename = img.filename.replace(/\.[^.]+$/, ".webp");

      // Check if optimized version already exists (idempotency)
      const existing = await prisma.imageStore.findUnique({
        where: { filename: newFilename },
        select: { id: true },
      });

      if (existing && existing.id !== img.id) {
        console.log(`  SKIP (optimized version already exists): ${newFilename}`);
        skipped++;
        continue;
      }

      // Update the record in-place with the optimized version
      await prisma.imageStore.update({
        where: { id: img.id },
        data: {
          filename: newFilename,
          mimeType: "image/webp",
          data: new Uint8Array(optimizedBuffer),
          size: newSize,
        },
      });

      totalSavedBytes += savings;
      optimized++;

      console.log(
        `  ✓ ${img.filename} (${dims}, ${formatBytes(originalSize)}) → ${newFilename} (${formatBytes(newSize)}) saved ${pctSaved}%`
      );

      // Now update all Edition/Event records that reference the old filename
      await updateReferences(img.filename, newFilename);
    } catch (err) {
      console.error(`  ✗ FAILED: ${img.filename}:`, err);
      failed++;
    }
  }

  console.log("\n=== Migration Summary ===");
  console.log(`  Total images: ${images.length}`);
  console.log(`  Optimized:    ${optimized}`);
  console.log(`  Skipped:      ${skipped}`);
  console.log(`  Failed:       ${failed}`);
  console.log(`  Total saved:  ${formatBytes(totalSavedBytes)}`);
  console.log("========================\n");

  await prisma.$disconnect();
}

/**
 * Update all DB records that reference the old image filename
 * to use the new optimized filename.
 */
async function updateReferences(oldFilename: string, newFilename: string) {
  const oldUrl = `/uploads/${oldFilename}`;
  const newUrl = `/uploads/${newFilename}`;

  // Update EventEdition image URL fields
  const editionFields = [
    "dynamicLogoUrl",
    "collegeLogoUrl",
    "deptLogoUrl",
    "institutionCrestUrl",
    "jubileeBadgeUrl",
    "stageHeaderBannerUrl",
    "heroBackgroundUrl",
  ];

  for (const field of editionFields) {
    try {
      const count = await prisma.$executeRawUnsafe(
        `UPDATE "event_editions" SET "${field}" = $1 WHERE "${field}" = $2`,
        newUrl,
        oldUrl
      );
      if (count > 0) {
        console.log(`    Updated EventEdition.${field}: ${oldUrl} → ${newUrl} (${count} rows)`);
      }
    } catch {
      // Field might not exist in all schemas — ignore
    }
  }

  // Update Event image URL fields
  const eventFields = ["imageUrl", "staffCoordinatorPhoto", "studentCoordinatorPhoto"];
  for (const field of eventFields) {
    try {
      const count = await prisma.$executeRawUnsafe(
        `UPDATE "events" SET "${field}" = $1 WHERE "${field}" = $2`,
        newUrl,
        oldUrl
      );
      if (count > 0) {
        console.log(`    Updated Event.${field}: ${oldUrl} → ${newUrl} (${count} rows)`);
      }
    } catch {
      // Field might not exist — ignore
    }
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
