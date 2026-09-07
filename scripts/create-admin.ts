import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

function getArg(flag: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${flag}=`));
  if (arg) {
    return arg.split("=").slice(1).join("=");
  }
  const flagIdx = process.argv.indexOf(`--${flag}`);
  if (flagIdx !== -1 && flagIdx + 1 < process.argv.length) {
    return process.argv[flagIdx + 1];
  }
  return undefined;
}

async function main() {
  const customDbUrl = getArg("dbUrl") || getArg("databaseUrl");
  if (customDbUrl) {
    process.env.DATABASE_URL = customDbUrl;
  }

  const databaseUrl = process.env.DATABASE_URL;
  const prisma = new PrismaClient(
    customDbUrl
      ? {
          datasources: {
            db: {
              url: customDbUrl,
            },
          },
        }
      : undefined
  );

  try {
    const email = (
      getArg("email") ||
      process.env.ADMIN_EMAIL ||
      "admin@shctpt.edu"
    )
      .trim()
      .toLowerCase();

    const rawPassword = (
      getArg("password") ||
      process.env.ADMIN_PASSWORD ||
      "admin123"
    ).trim();

    const name = (
      getArg("name") ||
      process.env.ADMIN_NAME ||
      "SHINE Railway Admin"
    ).trim();

    const phone = (
      getArg("phone") ||
      process.env.ADMIN_PHONE ||
      "+91 9876543210"
    ).trim();

    const college = (
      getArg("college") ||
      process.env.ADMIN_COLLEGE ||
      "Sacred Heart College (Autonomous), Tirupattur"
    ).trim();

    if (!email || !rawPassword) {
      console.error("❌ Email and Password are required.");
      process.exit(1);
    }

    let dbHost = "Localhost / Environment Variable";
    if (databaseUrl) {
      try {
        const sanitizedUrl = databaseUrl.replace(/^postgresql:\/\//i, "http://");
        dbHost = new URL(sanitizedUrl).host;
      } catch {
        dbHost = databaseUrl.split("@")[1]?.split("/")[0] || "Custom DB Host";
      }
    }

    console.log("⚡ Creating / Updating Admin User...");
    console.log(`📌 Database Target: ${dbHost}`);
    console.log(`👤 Target Email: ${email}`);

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    let user;
    if (existingUser) {
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          role: Role.ADMIN,
          passwordHash,
          phone,
          college,
        },
      });
      console.log(`✅ Existing user found and updated to ADMIN role successfully!`);
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.ADMIN,
          phone,
          college,
        },
      });
      console.log(`✅ New ADMIN user created successfully!`);
    }

    console.log("\n==========================================");
    console.log("🎉 ADMIN USER CREDENTIALS");
    console.log("==========================================");
    console.log(`ID:       ${user.id}`);
    console.log(`Name:     ${user.name}`);
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${rawPassword}`);
    console.log(`Role:     ${user.role}`);
    console.log(`College:  ${user.college}`);
    console.log("==========================================");
    console.log("👉 Login at: /login or your deployed Railway URL/login");
    console.log("==========================================\n");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Error creating admin user:", err);
  process.exit(1);
});
