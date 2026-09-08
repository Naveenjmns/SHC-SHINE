import prisma from "../src/lib/prisma";
import { saveImageToStore, getImageByFilename } from "../src/lib/imageStorage";

async function testUploadFlow() {
  console.log("=== Testing Step 1 Image Storage & Serving Pipeline ===");

  // 1. Create a dummy test PNG buffer (1x1 transparent PNG)
  const testPngBase64 = "iVBORw0KGgoAAAANSAhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const testBuffer = Buffer.from(testPngBase64, "base64");

  // 2. Test saveImageToStore
  const publicUrl = await saveImageToStore(testBuffer, "image/png", "test-image.png");
  console.log(`✓ Uploaded file saved. Returned URL: ${publicUrl}`);

  const filename = publicUrl.replace("/uploads/", "");

  // 3. Test getImageByFilename from DB / disk cache
  const retrieved = await getImageByFilename(filename);
  if (!retrieved) {
    throw new Error(`FAIL: Could not retrieve ${filename} from ImageStore!`);
  }

  console.log(`✓ Retrieved image ${filename} from ImageStore. Size: ${retrieved.data.length} bytes, MIME: ${retrieved.mimeType}`);

  // 4. Verify data integrity
  if (retrieved.data.toString("base64") !== testPngBase64) {
    throw new Error("FAIL: Binary data mismatch after retrieval!");
  }
  console.log("✓ Data integrity verified. Binary matches 100%.");

  // Clean up test record
  await prisma.imageStore.delete({ where: { filename } });
  console.log("✓ Test record cleaned up.");

  console.log("\n=== STEP 1 VERIFICATION PASSED SUCCESSFULLY ===");
}

testUploadFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
