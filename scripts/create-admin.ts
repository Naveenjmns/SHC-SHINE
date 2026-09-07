import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@shctpt.edu").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "SHINE Admin";
  const phone = process.env.ADMIN_PHONE || "+91 9876543210";
  const college = process.env.ADMIN_COLLEGE || "Sacred Heart College (Autonomous), Tirupattur";

  console.log(`🔐 Creating/updating admin user: ${email}...`);

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: Role.ADMIN,
      passwordHash,
      phone,
      college,
    },
    create: {
      name,
      email,
      role: Role.ADMIN,
      passwordHash,
      phone,
      college,
    },
  });

  console.log("✅ Admin user successfully set up!");
  console.log(`-----------------------------------`);
  console.log(`Email:    ${admin.email}`);
  console.log(`Password: ${password}`);
  console.log(`Role:     ${admin.role}`);
  console.log(`-----------------------------------`);
}

main()
  .catch((e) => {
    console.error("❌ Failed to create admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
