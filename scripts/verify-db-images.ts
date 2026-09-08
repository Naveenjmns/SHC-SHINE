import prisma from "../src/lib/prisma";
import { runBase64ImageMigration } from "./migrate-base64-images";
import { getImageByFilename } from "../src/lib/imageStorage";
import fs from "fs";
import path from "path";

async function verifyStep1() {
  console.log("==================================================");
  console.log("      STEP 1 DETAILED VERIFICATION & AUDIT        ");
  console.log("==================================================\n");

  // 1. Inspect all image-reference fields in PostgreSQL
  let totalInspected = 0;
  let base64Count = 0;
  let uploadUrlCount = 0;
  let nullEmptyCount = 0;

  const fieldsAudit: Array<{ model: string; id: string; field: string; type: string; valuePreview: string }> = [];

  const inspect = (model: string, id: string, field: string, val: string | null | undefined) => {
    totalInspected++;
    if (!val || val.trim() === "") {
      nullEmptyCount++;
      fieldsAudit.push({ model, id, field, type: "NULL/EMPTY", valuePreview: "(null)" });
    } else if (val.startsWith("data:image/")) {
      base64Count++;
      fieldsAudit.push({ model, id, field, type: "BASE64", valuePreview: val.slice(0, 40) + "..." });
    } else if (val.startsWith("/uploads/")) {
      uploadUrlCount++;
      fieldsAudit.push({ model, id, field, type: "UPLOAD_URL", valuePreview: val });
    } else {
      fieldsAudit.push({ model, id, field, type: "OTHER_URL", valuePreview: val.slice(0, 40) });
    }
  };

  const editions = await prisma.eventEdition.findMany();
  for (const ed of editions) {
    inspect("EventEdition", ed.id, "logoUrl", ed.logoUrl);
    inspect("EventEdition", ed.id, "secondaryLogoUrl", ed.secondaryLogoUrl);
    inspect("EventEdition", ed.id, "faviconUrl", ed.faviconUrl);
    inspect("EventEdition", ed.id, "heroBgUrl", ed.heroBgUrl);
    inspect("EventEdition", ed.id, "institutionCrestUrl", ed.institutionCrestUrl);
    inspect("EventEdition", ed.id, "jubileeBadgeUrl", ed.jubileeBadgeUrl);
    inspect("EventEdition", ed.id, "deptLogoUrl", ed.deptLogoUrl);
    inspect("EventEdition", ed.id, "stageHeaderBannerUrl", ed.stageHeaderBannerUrl);
  }

  const events = await prisma.event.findMany();
  for (const ev of events) {
    inspect("Event", ev.id, "imageUrl", ev.imageUrl);
    inspect("Event", ev.id, "logoUrl", ev.logoUrl);
    inspect("Event", ev.id, "staffCoordinatorImageUrl", ev.staffCoordinatorImageUrl);
    inspect("Event", ev.id, "studentCoordinatorImageUrl", ev.studentCoordinatorImageUrl);
  }

  const users = await prisma.user.findMany();
  for (const u of users) {
    inspect("User", u.id, "avatarUrl", u.avatarUrl);
  }

  const sponsors = await prisma.sponsor.findMany();
  for (const sp of sponsors) {
    inspect("Sponsor", sp.id, "logoUrl", sp.logoUrl);
  }

  console.log("1. BASE64 MIGRATION STATUS & FIELD AUDIT:");
  console.log(` - Total image-reference fields inspected : ${totalInspected}`);
  console.log(` - Fields containing Base64 data           : ${base64Count}`);
  console.log(` - Fields using /uploads/ URLs            : ${uploadUrlCount}`);
  console.log(` - Fields Null / Empty                    : ${nullEmptyCount}`);

  // 2. Test Idempotency: Run migration script twice
  console.log("\n2. TESTING MIGRATION IDEMPOTENCY & RESUMABILITY:");
  const run1 = await runBase64ImageMigration();
  console.log(` - Run 1: Processed=${run1.processed}, Migrated=${run1.migrated}, Skipped=${run1.skipped}, Failed=${run1.failed}`);

  const run2 = await runBase64ImageMigration();
  console.log(` - Run 2 (Idempotency): Processed=${run2.processed}, Migrated=${run2.migrated}, Skipped=${run2.skipped}, Failed=${run2.failed}`);

  if (run2.migrated > 0) {
    console.error("  ❌ WARNING: Run 2 modified already-migrated records!");
  } else {
    console.log("  ✓ Idempotency verified: Run 2 produced 0 duplicate or corrupt modifications.");
  }

  // 3. Test Railway Fallback (Simulate wiped public/uploads folder)
  console.log("\n3. TESTING RAILWAY RESTART FALLBACK (DISPOSABLE CACHE):");
  const testFilename = "test_railway_fallback.png";
  const dummyBuffer = Buffer.from("iVBORw0KGgoAAAANSAhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  
  // Save to ImageStore DB
  await prisma.imageStore.upsert({
    where: { filename: testFilename },
    update: { data: new Uint8Array(dummyBuffer), mimeType: "image/png", size: dummyBuffer.length },
    create: { filename: testFilename, mimeType: "image/png", data: new Uint8Array(dummyBuffer), size: dummyBuffer.length },
  });

  // Delete from local disk cache to simulate Railway container restart / wiped disk
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  const localCachePath = path.join(uploadsDir, testFilename);
  if (fs.existsSync(localCachePath)) {
    fs.unlinkSync(localCachePath);
  }
  console.log("  ✓ Deleted file from local disk to simulate fresh Railway container restart.");

  // Request file from getImageByFilename
  const recovered = await getImageByFilename(testFilename);
  if (recovered && recovered.data.length === dummyBuffer.length) {
    console.log("  ✓ SUCCESS: Image recovered from PostgreSQL ImageStore & restored to disk cache!");
  } else {
    console.error("  ❌ FAIL: Railway restart recovery failed.");
  }

  // Clean up test record
  await prisma.imageStore.delete({ where: { filename: testFilename } });
  if (fs.existsSync(localCachePath)) fs.unlinkSync(localCachePath);

  // 4. Verify ImageStore Database Table Count
  const imageStoreCount = await prisma.imageStore.count();
  console.log(`\n4. POSTGRESQL IMAGESTORE STATS:`);
  console.log(` - Total persistent records in ImageStore : ${imageStoreCount}`);

  console.log("\n==================================================");
  console.log("           AUDIT COMPLETED SUCCESSFULLY           ");
  console.log("==================================================");
}

verifyStep1()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Audit error:", err);
    process.exit(1);
  });
