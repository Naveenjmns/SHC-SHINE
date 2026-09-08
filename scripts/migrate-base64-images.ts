import prisma from "../src/lib/prisma";
import { saveImageToStore, getImageByFilename } from "../src/lib/imageStorage";

export interface MigrationResult {
  processed: number;
  migrated: number;
  skipped: number;
  failed: number;
  details: string[];
}

export async function runBase64ImageMigration(): Promise<MigrationResult> {
  const result: MigrationResult = {
    processed: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };

  const processField = async (
    modelName: string,
    id: string,
    fieldName: string,
    value: string | null | undefined,
    updateFn: (newUrl: string) => Promise<any>
  ) => {
    if (!value) return;
    result.processed++;

    if (!value.startsWith("data:image/")) {
      result.skipped++;
      return;
    }

    try {
      const matches = value.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!matches) {
        result.failed++;
        result.details.push(`[${modelName}:${id}:${fieldName}] Invalid base64 data URL format.`);
        return;
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      if (buffer.length === 0) {
        result.failed++;
        result.details.push(`[${modelName}:${id}:${fieldName}] Base64 buffer is empty.`);
        return;
      }

      // 1. Store in ImageStore & local disk
      const newUrl = await saveImageToStore(buffer, mimeType);
      const filename = newUrl.replace("/uploads/", "");

      // 2. Verify ImageStore record exists and has valid data
      const stored = await getImageByFilename(filename);
      if (!stored || stored.data.length === 0) {
        result.failed++;
        result.details.push(`[${modelName}:${id}:${fieldName}] Verification failed for ${filename}. Field preserved.`);
        return;
      }

      // 3. Update database record only after verification
      await updateFn(newUrl);

      result.migrated++;
      result.details.push(`[${modelName}:${id}:${fieldName}] Successfully migrated to ${newUrl} (${Math.round(buffer.length / 1024)} KB).`);
    } catch (err: any) {
      result.failed++;
      result.details.push(`[${modelName}:${id}:${fieldName}] Error: ${err.message}. Original data preserved.`);
    }
  };

  // 1. Migrate EventEdition records
  const editions = await prisma.eventEdition.findMany();
  for (const ed of editions) {
    await processField("EventEdition", ed.id, "logoUrl", ed.logoUrl, (url) =>
      prisma.eventEdition.update({ where: { id: ed.id }, data: { logoUrl: url } })
    );
    await processField("EventEdition", ed.id, "secondaryLogoUrl", ed.secondaryLogoUrl, (url) =>
      prisma.eventEdition.update({ where: { id: ed.id }, data: { secondaryLogoUrl: url } })
    );
    await processField("EventEdition", ed.id, "faviconUrl", ed.faviconUrl, (url) =>
      prisma.eventEdition.update({ where: { id: ed.id }, data: { faviconUrl: url } })
    );
    await processField("EventEdition", ed.id, "heroBgUrl", ed.heroBgUrl, (url) =>
      prisma.eventEdition.update({ where: { id: ed.id }, data: { heroBgUrl: url } })
    );
    await processField("EventEdition", ed.id, "institutionCrestUrl", ed.institutionCrestUrl, (url) =>
      prisma.eventEdition.update({ where: { id: ed.id }, data: { institutionCrestUrl: url } })
    );
    await processField("EventEdition", ed.id, "jubileeBadgeUrl", ed.jubileeBadgeUrl, (url) =>
      prisma.eventEdition.update({ where: { id: ed.id }, data: { jubileeBadgeUrl: url } })
    );
    await processField("EventEdition", ed.id, "deptLogoUrl", ed.deptLogoUrl, (url) =>
      prisma.eventEdition.update({ where: { id: ed.id }, data: { deptLogoUrl: url } })
    );
    await processField("EventEdition", ed.id, "stageHeaderBannerUrl", ed.stageHeaderBannerUrl, (url) =>
      prisma.eventEdition.update({ where: { id: ed.id }, data: { stageHeaderBannerUrl: url } })
    );
  }

  // 2. Migrate Event records
  const events = await prisma.event.findMany();
  for (const ev of events) {
    await processField("Event", ev.id, "imageUrl", ev.imageUrl, (url) =>
      prisma.event.update({ where: { id: ev.id }, data: { imageUrl: url } })
    );
    await processField("Event", ev.id, "logoUrl", ev.logoUrl, (url) =>
      prisma.event.update({ where: { id: ev.id }, data: { logoUrl: url } })
    );
    await processField("Event", ev.id, "staffCoordinatorImageUrl", ev.staffCoordinatorImageUrl, (url) =>
      prisma.event.update({ where: { id: ev.id }, data: { staffCoordinatorImageUrl: url } })
    );
    await processField("Event", ev.id, "studentCoordinatorImageUrl", ev.studentCoordinatorImageUrl, (url) =>
      prisma.event.update({ where: { id: ev.id }, data: { studentCoordinatorImageUrl: url } })
    );
  }

  // 3. Migrate User records
  const users = await prisma.user.findMany();
  for (const u of users) {
    await processField("User", u.id, "avatarUrl", u.avatarUrl, (url) =>
      prisma.user.update({ where: { id: u.id }, data: { avatarUrl: url } })
    );
  }

  // 4. Migrate Sponsor records
  const sponsors = await prisma.sponsor.findMany();
  for (const sp of sponsors) {
    await processField("Sponsor", sp.id, "logoUrl", sp.logoUrl, (url) =>
      prisma.sponsor.update({ where: { id: sp.id }, data: { logoUrl: url } })
    );
  }

  return result;
}

// Executed directly if called via CLI: `npx tsx scripts/migrate-base64-images.ts`
if (require.main === module) {
  runBase64ImageMigration()
    .then((res) => {
      console.log("=== Base64 Image Migration Finished ===");
      console.log(`Total Processed: ${res.processed}`);
      console.log(`Successfully Migrated: ${res.migrated}`);
      console.log(`Already Clean / Skipped: ${res.skipped}`);
      console.log(`Failed / Preserved: ${res.failed}`);
      if (res.details.length > 0) {
        console.log("\nDetails:");
        res.details.forEach((d) => console.log(" - " + d));
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration error:", err);
      process.exit(1);
    });
}
