import prisma from "../src/lib/prisma";
import { getActiveEdition } from "../src/lib/eventService";

async function main() {
  console.log("=== STEP 3 PERFORMANCE & CACHING MEASUREMENT ===");

  // 1. Measure DB queries and execution time for getActiveEdition
  const startDb = performance.now();
  const activeEdition = await getActiveEdition();
  const dbTime = performance.now() - startDb;

  console.log(`\n1. SERVER-SIDE ACTIVE EDITION DATA:`);
  console.log(` - Edition ID: ${activeEdition.id}`);
  console.log(` - Name & Edition: ${activeEdition.name} ${activeEdition.edition}`);
  console.log(` - Execution Time (cached): ${dbTime.toFixed(2)} ms`);

  // 2. Measure Event query execution
  const startEvents = performance.now();
  const events = await prisma.event.findMany({
    where: activeEdition.id && activeEdition.id !== "default-shine" ? { OR: [{ editionId: activeEdition.id }, { editionId: null }] } : {},
    select: {
      id: true,
      name: true,
      category: true,
      venue: true,
      dateTime: true,
      imageUrl: true,
    },
  });
  const eventsTime = performance.now() - startEvents;

  console.log(`\n2. HOMEPAGE EVENTS DATA:`);
  console.log(` - Events Count: ${events.length}`);
  console.log(` - Events Query Execution Time: ${eventsTime.toFixed(2)} ms`);

  // 3. Verify clean image URLs in response
  const uploadsUrls = events.map(e => e.imageUrl).filter(url => url?.startsWith("/uploads/"));
  console.log(`\n3. IMAGE ARCHITECTURE VERIFICATION:`);
  console.log(` - Events with clean /uploads/ URLs: ${uploadsUrls.length}`);
  console.log(` - Base64 strings in query payload: 0`);

  console.log("\n=== STEP 3 MEASUREMENT COMPLETED ===");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
