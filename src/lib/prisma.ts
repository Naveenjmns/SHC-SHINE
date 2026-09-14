import { PrismaClient } from "@prisma/client";

// Schema revision token: bump this whenever Prisma schema fields or models change
// This allows hot reload to replace stale in-memory Prisma client instances without restarting Next.js
const SCHEMA_REVISION = 2;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaRev: number | undefined;
};

if (process.env.NODE_ENV !== "production") {
  if (globalForPrisma.prisma && globalForPrisma.prismaSchemaRev !== SCHEMA_REVISION) {
    try {
      globalForPrisma.prisma.$disconnect();
    } catch (e) {}
    globalForPrisma.prisma = undefined;
  }
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaRev = SCHEMA_REVISION;
}

export default prisma;

