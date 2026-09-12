import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const Role = {
  STUDENT: "STUDENT",
  COORDINATOR: "COORDINATOR",
  ADMIN: "ADMIN",
  FOOD_COORDINATOR: "FOOD_COORDINATOR",
} as const;

const EventCategory = {
  ON_STAGE: "ON_STAGE",
  OFF_STAGE: "OFF_STAGE",
} as const;

const RegistrationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed for SHINE Reusable Platform...");

  // Clean existing data
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.navigationItem.deleteMany();
  await prisma.sponsor.deleteMany();
  await prisma.eventEdition.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Active Event Edition (SHINE 2026)
  const activeEdition = await prisma.eventEdition.create({
    data: {
      name: "SHINE",
      edition: "2026",
      slug: "shine-2026",
      isActive: true,
      status: "LIVE",
      tagline: "Where Ideas Begin to Shine",
      metadataText: "TECHNOLOGY • INNOVATION • CREATIVITY",
      description: "SHINE 26 is the annual intercollegiate flagship symposium organized by the Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur.",
      venue: "SGB Main Auditorium, Sacred Heart College (Autonomous), Tirupattur",
      startDate: new Date("2026-10-15T09:00:00Z"),
      endDate: new Date("2026-10-15T18:00:00Z"),
      primaryCtaText: "EXPLORE SHINE →",
      primaryCtaLink: "#events",
      themePrimaryAccent: "#FF6B1A",
      themeSecondaryAccent: "#D9A441",
      themeBgColor: "#FAF8F5",
    },
  });
  console.log(`✅ Active Event Edition created: ${activeEdition.name} ${activeEdition.edition}`);

  // 2. Navigation Items for Active Edition
  const navItems = [
    { label: "About", url: "#about", order: 1, isEnabled: true },
    { label: "Schedule", url: "#schedule", order: 2, isEnabled: true },
    { label: "Events", url: "#events", order: 3, isEnabled: true },
    { label: "Rules", url: "#rules", order: 4, isEnabled: true },
    { label: "Stage View", url: "/leaderboard", order: 5, isEnabled: true },
  ];
  for (const nav of navItems) {
    await prisma.navigationItem.create({
      data: { ...nav, editionId: activeEdition.id },
    });
  }
  console.log(`✅ Navigation items created (${navItems.length}).`);

  // 3. Create Users (Admin, Coordinators, Food Committee, Student)
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const coordPasswordHash = await bcrypt.hash("coord123", 10);
  const foodCoordPasswordHash = await bcrypt.hash("food123", 10);
  const studentPasswordHash = await bcrypt.hash("student123", 10);

  const railwayAdminPasswordHash = await bcrypt.hash("RailwayAdmin2026!", 10);

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

  const railwayAdmin = await prisma.user.create({
    data: {
      name: "Railway Admin",
      email: "railway.admin@shctpt.edu",
      phone: "+91 9876543210",
      passwordHash: railwayAdminPasswordHash,
      role: Role.ADMIN,
      college: "Sacred Heart College (Autonomous), Tirupattur",
    },
  });

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

  const foodCoord = await prisma.user.create({
    data: {
      name: "SHINE Food Committee",
      email: "food@shctpt.edu",
      phone: "+91 9840112233",
      passwordHash: foodCoordPasswordHash,
      role: Role.FOOD_COORDINATOR,
      college: "Sacred Heart College (Autonomous), Tirupattur",
    },
  });

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

  console.log(`✅ Admin, Coordinators, Food Committee, and Student created.`);

  // 4. Create Events linked to Active Edition
  const baseDate = new Date("2026-10-15T09:30:00Z");

  const eventsData = [
    {
      name: "Code & Conquer",
      description: "High-octane algorithmic coding battle under strict time constraints. Test data structures, logic, and speed.",
      category: EventCategory.ON_STAGE,
      fee: 100,
      capacity: 50,
      venue: "Main Auditorium",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 1),
      coordinatorId: coordAlex.id,
      editionId: activeEdition.id,
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
      editionId: activeEdition.id,
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
      editionId: activeEdition.id,
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
      editionId: activeEdition.id,
    },
    {
      name: "Web Design",
      description: "Create responsive, accessible, and stunning user interfaces within 90 minutes from a secret design prompt.",
      category: EventCategory.OFF_STAGE,
      fee: 100,
      capacity: 45,
      venue: "Computer Lab 1",
      dateTime: new Date(baseDate.getTime() + 1000 * 60 * 60 * 1.5),
      coordinatorId: coordPriya.id,
      editionId: activeEdition.id,
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
      editionId: activeEdition.id,
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
      editionId: activeEdition.id,
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
      editionId: activeEdition.id,
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
      editionId: activeEdition.id,
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
      editionId: activeEdition.id,
    },
  ];

  const createdEvents = [];
  for (const e of eventsData) {
    const ev = await prisma.event.create({ data: e });
    createdEvents.push(ev);
  }
  console.log(`✅ Created ${createdEvents.length} events for ${activeEdition.name} ${activeEdition.edition}.`);

  // 5. Sample Registrations
  await prisma.registration.create({
    data: {
      userId: studentRahul.id,
      eventId: createdEvents[0].id,
      status: RegistrationStatus.CONFIRMED,
      result: "1st Place Winner",
    },
  });

  await prisma.registration.create({
    data: {
      userId: studentRahul.id,
      eventId: createdEvents[1].id,
      status: RegistrationStatus.PENDING,
    },
  });

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
