import { PrismaClient, Role, EventCategory, RegistrationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed for SHINE 26...");

  // Clean existing data if any
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const coordPasswordHash = await bcrypt.hash("coord123", 10);
  const studentPasswordHash = await bcrypt.hash("student123", 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: "SHINE Admin",
      email: "admin@shctpt.edu",
      phone: "+91 9876543210",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      college: "Sacred Heart College (Autonomous), Tirupattur",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // 2. Create Coordinators
  const coordAlex = await prisma.user.create({
    data: {
      name: "Prof. Alex (Tech Lead)",
      email: "coord.alex@shctpt.edu",
      phone: "+91 9840123456",
      passwordHash: coordPasswordHash,
      role: Role.COORDINATOR,
      college: "Sacred Heart College (Autonomous)",
    },
  });

  const coordPriya = await prisma.user.create({
    data: {
      name: "Prof. Priya (Event Lead)",
      email: "coord.priya@shctpt.edu",
      phone: "+91 9840654321",
      passwordHash: coordPasswordHash,
      role: Role.COORDINATOR,
      college: "Sacred Heart College (Autonomous)",
    },
  });
  console.log(`✅ Coordinators created: ${coordAlex.email}, ${coordPriya.email}`);

  // 3. Create Sample Student
  const studentRahul = await prisma.user.create({
    data: {
      name: "Rahul Sharma",
      email: "student@example.com",
      phone: "+91 9123456780",
      passwordHash: studentPasswordHash,
      role: Role.STUDENT,
      college: "Loyola College, Chennai",
    },
  });
  console.log(`✅ Student created: ${studentRahul.email}`);

  // 4. Create Events
  const baseDate = new Date("2026-10-15T09:30:00Z");

  const eventsData = [
    // On-Stage
    {
      name: "Code & Conquer",
      description: "High-octane algorithmic coding battle under strict time constraints. Test data structures, logic, and speed.",
      category: EventCategory.ON_STAGE,
      fee: 100,
      capacity: 50,
      venue: "Main Auditorium",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 1), // 10:30 AM
      coordinatorId: coordAlex.id,
    },
    {
      name: "Tech Quiz",
      description: "Ultimate technology trivia: emerging tech, CS fundamentals, AI breakthroughs, and rapid-fire buzzer rounds.",
      category: EventCategory.ON_STAGE,
      fee: 50,
      capacity: 60,
      venue: "Seminar Hall A",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 2),
      coordinatorId: coordAlex.id,
    },
    {
      name: "Paper Presentation",
      description: "Present research and innovations in AI, Cloud, Cybersecurity, and Quantum Computing to faculty evaluators.",
      category: EventCategory.ON_STAGE,
      fee: 100,
      capacity: 40,
      venue: "Conference Room",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 3),
      coordinatorId: coordPriya.id,
    },
    {
      name: "Debate",
      description: "Clash of ideas on tech ethics, AI governance, autonomous systems, and digital sovereignty.",
      category: EventCategory.ON_STAGE,
      fee: 50,
      capacity: 30,
      venue: "Main Auditorium",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 4),
      coordinatorId: coordPriya.id,
    },

    // Off-Stage
    {
      name: "Web Design",
      description: "Create responsive, accessible, and stunning user interfaces within 90 minutes from a secret design prompt.",
      category: EventCategory.OFF_STAGE,
      fee: 100,
      capacity: 45,
      venue: "Computer Lab 1",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 1.5),
      coordinatorId: coordPriya.id,
    },
    {
      name: "Poster Design",
      description: "Digital graphic design showdown using Figma, Photoshop, or Canva. Focus on visual harmony and thematic clarity.",
      category: EventCategory.OFF_STAGE,
      fee: 50,
      capacity: 40,
      venue: "Computer Lab 2",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 2.5),
      coordinatorId: coordAlex.id,
    },
    {
      name: "Treasure Hunt",
      description: "Campus-wide puzzle hunt combining cryptography, steganography, and algorithmic clue navigation.",
      category: EventCategory.OFF_STAGE,
      fee: 100,
      capacity: 80,
      venue: "Across Campus",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 3.5),
      coordinatorId: coordAlex.id,
    },
    {
      name: "Gaming Zone",
      description: "E-Sports tournament featuring BGMI, Valorant, and FIFA. Strategy, reflexes, and team synergy.",
      category: EventCategory.OFF_STAGE,
      fee: 50,
      capacity: 100,
      venue: "Recreation Hall",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 4.5),
      coordinatorId: coordAlex.id,
    },
    {
      name: "Photography",
      description: "Capture the emotion and electric atmosphere of SHINE 26. Submit raw and edited shots for judging.",
      category: EventCategory.OFF_STAGE,
      fee: 50,
      capacity: 50,
      venue: "Campus Grounds",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 2),
      coordinatorId: coordPriya.id,
    },
    {
      name: "IT Manager",
      description: "Multi-round leadership triathlon assessing aptitude, crisis management, presentation, and technical acumen.",
      category: EventCategory.OFF_STAGE,
      fee: 150,
      capacity: 30,
      venue: "Seminar Hall B",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 3),
      coordinatorId: coordPriya.id,
    },
  ];

  const createdEvents = [];
  for (const e of eventsData) {
    const ev = await prisma.event.create({ data: e });
    createdEvents.push(ev);
  }
  console.log(`✅ Created ${createdEvents.length} events.`);

  // 5. Create Sample Registrations for studentRahul
  const reg1 = await prisma.registration.create({
    data: {
      userId: studentRahul.id,
      eventId: createdEvents[0].id, // Code & Conquer
      status: RegistrationStatus.CONFIRMED,
      result: "1st Place Winner",
    },
  });

  const reg2 = await prisma.registration.create({
    data: {
      userId: studentRahul.id,
      eventId: createdEvents[1].id, // Tech Quiz
      status: RegistrationStatus.PENDING,
    },
  });

  const reg3 = await prisma.registration.create({
    data: {
      userId: studentRahul.id,
      eventId: createdEvents[4].id, // Web Design
      status: RegistrationStatus.CONFIRMED,
    },
  });

  console.log(`Created 3 sample registrations for ${studentRahul.name}.`);
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
