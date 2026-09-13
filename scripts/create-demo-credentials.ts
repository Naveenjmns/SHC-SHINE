import { PrismaClient, Role, RegistrationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("⚡ Creating / Updating Demo Credentials for SHINE 26...\n");

  // 1. System Administrator
  const adminEmail = "admin@shctpt.edu";
  const adminPassword = "admin123";
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "SHINE Master Administrator",
      role: Role.ADMIN,
      phone: "+91 9876543210",
      college: "Sacred Heart College (Autonomous), Tirupattur",
      foodPreference: "VEG",
      passwordHash: adminHash,
    },
    create: {
      email: adminEmail,
      name: "SHINE Master Administrator",
      role: Role.ADMIN,
      phone: "+91 9876543210",
      college: "Sacred Heart College (Autonomous), Tirupattur",
      foodPreference: "VEG",
      passwordHash: adminHash,
    },
  });
  console.log(`✅ System Administrator User ready:`);
  console.log(`   Email:    ${adminUser.email}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role:     ${adminUser.role}`);
  console.log(`   Portal:   /admin\n`);

  // 2. Food Committee Coordinator
  const foodEmail = "food@shctpt.edu";
  const foodPassword = "food123";
  const foodHash = await bcrypt.hash(foodPassword, 10);

  const foodUser = await prisma.user.upsert({
    where: { email: foodEmail },
    update: {
      name: "SHINE Food Committee",
      role: Role.FOOD_COORDINATOR,
      phone: "+91 9840112233",
      college: "Sacred Heart College (Autonomous), Tirupattur",
      passwordHash: foodHash,
    },
    create: {
      email: foodEmail,
      name: "SHINE Food Committee",
      role: Role.FOOD_COORDINATOR,
      phone: "+91 9840112233",
      college: "Sacred Heart College (Autonomous), Tirupattur",
      passwordHash: foodHash,
    },
  });
  console.log(`✅ Food Committee User ready:`);
  console.log(`   Email:    ${foodUser.email}`);
  console.log(`   Password: ${foodPassword}`);
  console.log(`   Role:     ${foodUser.role}`);
  console.log(`   Portal:   /food\n`);

  // 3. Event Coordinator
  const coordEmail = "coord.alex@shctpt.edu";
  const coordPassword = "coord123";
  const coordHash = await bcrypt.hash(coordPassword, 10);

  const coordUser = await prisma.user.upsert({
    where: { email: coordEmail },
    update: {
      name: "Prof. Alex (Tech Lead Coordinator)",
      role: Role.COORDINATOR,
      phone: "+91 9840123456",
      college: "Sacred Heart College (Autonomous), Tirupattur",
      passwordHash: coordHash,
    },
    create: {
      email: coordEmail,
      name: "Prof. Alex (Tech Lead Coordinator)",
      role: Role.COORDINATOR,
      phone: "+91 9840123456",
      college: "Sacred Heart College (Autonomous), Tirupattur",
      passwordHash: coordHash,
    },
  });

  // Also create simple alias coordinator account: coordinator@shctpt.edu
  await prisma.user.upsert({
    where: { email: "coordinator@shctpt.edu" },
    update: {
      name: "Event Coordinator",
      role: Role.COORDINATOR,
      phone: "+91 9840123450",
      college: "Sacred Heart College (Autonomous), Tirupattur",
      passwordHash: coordHash,
    },
    create: {
      email: "coordinator@shctpt.edu",
      name: "Event Coordinator",
      role: Role.COORDINATOR,
      phone: "+91 9840123450",
      college: "Sacred Heart College (Autonomous), Tirupattur",
      passwordHash: coordHash,
    },
  });
  console.log(`✅ Coordinator User ready:`);
  console.log(`   Email:    ${coordUser.email} (or coordinator@shctpt.edu)`);
  console.log(`   Password: ${coordPassword}`);
  console.log(`   Role:     ${coordUser.role}`);
  console.log(`   Portal:   /coordinator\n`);

  // 4. Student Delegate
  const studentEmail = "student@example.com";
  const studentPassword = "student123";
  const studentHash = await bcrypt.hash(studentPassword, 10);

  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {
      name: "Rahul Sharma",
      role: Role.STUDENT,
      phone: "+91 9123456780",
      college: "Loyola College, Chennai",
      foodPreference: "NON_VEG",
      passwordHash: studentHash,
    },
    create: {
      email: studentEmail,
      name: "Rahul Sharma",
      role: Role.STUDENT,
      phone: "+91 9123456780",
      college: "Loyola College, Chennai",
      foodPreference: "NON_VEG",
      passwordHash: studentHash,
    },
  });

  // Also create student alias with college domain: student@shctpt.edu
  await prisma.user.upsert({
    where: { email: "student@shctpt.edu" },
    update: {
      name: "Rahul Sharma",
      role: Role.STUDENT,
      phone: "9123456780",
      college: "Loyola College, Chennai",
      foodPreference: "NON_VEG",
      passwordHash: studentHash,
    },
    create: {
      email: "student@shctpt.edu",
      name: "Rahul Sharma",
      role: Role.STUDENT,
      phone: "9123456780",
      college: "Loyola College, Chennai",
      foodPreference: "NON_VEG",
      passwordHash: studentHash,
    },
  });
  console.log(`✅ Student User ready:`);
  console.log(`   Email:    ${studentUser.email} (or student@shctpt.edu)`);
  console.log(`   Phone:    ${studentUser.phone} (can also log in with Mobile Number)`);
  console.log(`   Password: ${studentPassword}`);
  console.log(`   Role:     ${studentUser.role}`);
  console.log(`   Portal:   /dashboard\n`);

  // 4. Ensure Student has confirmed registrations for realistic testing
  const activeEdition = await prisma.eventEdition.findFirst({
    where: { isActive: true },
  });

  if (activeEdition) {
    const events = await prisma.event.findMany({
      where: { editionId: activeEdition.id },
      take: 2,
    });

    if (events.length > 0) {
      for (let i = 0; i < events.length; i++) {
        const ev = events[i];
        const existingReg = await prisma.registration.findFirst({
          where: {
            userId: studentUser.id,
            eventId: ev.id,
          },
        });

        if (existingReg) {
          await prisma.registration.update({
            where: { id: existingReg.id },
            data: {
              status: RegistrationStatus.CONFIRMED,
              result: i === 0 ? "1st Place Winner" : null,
            },
          });
        } else {
          await prisma.registration.create({
            data: {
              userId: studentUser.id,
              eventId: ev.id,
              status: RegistrationStatus.CONFIRMED,
              result: i === 0 ? "1st Place Winner" : null,
            },
          });
        }
      }
      console.log(`✅ Linked 2 confirmed event registrations to student (${studentUser.email})`);
    }

    // 5. Ensure Delegation & DelegationMember exist for student food & badge pass
    let delegation = await prisma.delegation.findFirst({
      where: { teamLeadEmail: studentUser.email.toLowerCase().trim() },
    });

    if (!delegation) {
      delegation = await prisma.delegation.create({
        data: {
          editionId: activeEdition.id,
          collegeName: studentUser.college || "Loyola College, Chennai",
          teamName: "Loyola Innovators",
          teamLeadName: studentUser.name,
          teamLeadEmail: studentUser.email.toLowerCase().trim(),
          teamLeadPhone: studentUser.phone || "+91 9123456780",
          totalFee: 200,
          paymentStatus: "PAID",
        },
      });
    }

    const badgeCode = "SHINE26-DEMO-RAHUL";
    const foodTokenCode = "FOOD-SHINE26-RAHUL";

    await prisma.delegationMember.upsert({
      where: { badgeCode },
      update: {
        name: studentUser.name,
        email: studentUser.email.toLowerCase().trim(),
        phone: studentUser.phone || "+91 9123456780",
        foodPreference: "NON_VEG",
        foodTokenClaimed: false,
      },
      create: {
        delegationId: delegation.id,
        name: studentUser.name,
        email: studentUser.email.toLowerCase().trim(),
        phone: studentUser.phone || "+91 9123456780",
        isTeamLead: true,
        badgeCode,
        foodTokenCode,
        foodPreference: "NON_VEG",
        foodTokenClaimed: false,
      },
    });
    console.log(`✅ Generated student Delegation Pass & Food Token:`);
    console.log(`   Badge Code:      ${badgeCode}`);
    console.log(`   Food Token Code: ${foodTokenCode}`);
  }

  console.log("\n========================================================");
  console.log("🎉 ALL TEST & PRODUCTION CREDENTIALS CONFIGURED!");
  console.log("========================================================");
}

main()
  .catch((e) => {
    console.error("Error creating demo credentials:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
