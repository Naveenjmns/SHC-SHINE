import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

async function handleSetup(searchParams?: URLSearchParams, body?: any) {
  const email = (
    body?.email ||
    searchParams?.get("email") ||
    "admin@shctpt.edu"
  ).toLowerCase().trim();

  const password =
    body?.password ||
    searchParams?.get("password") ||
    "admin123";

  const name =
    body?.name ||
    searchParams?.get("name") ||
    "SHINE Admin";

  const setupSecret = body?.setupSecret || searchParams?.get("setupSecret");

  // Check security:
  const envSecret = process.env.ADMIN_SETUP_SECRET;
  if (envSecret) {
    if (setupSecret !== envSecret) {
      return NextResponse.json(
        { success: false, message: "Invalid setupSecret provided." },
        { status: 403 }
      );
    }
  } else {
    // If no secret configured, check if admins exist
    const existingAdmin = await prisma.user.findFirst({
      where: { role: Role.ADMIN },
    });

    if (existingAdmin && !searchParams?.get("force")) {
      return NextResponse.json(
        {
          success: true,
          message: `Admin user '${existingAdmin.email}' already exists in the database. You can log in directly at /login.`,
          adminEmail: existingAdmin.email,
        },
        { status: 200 }
      );
    }
  }

  if (password.length < 6) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: Role.ADMIN,
      passwordHash,
    },
    create: {
      name,
      email,
      role: Role.ADMIN,
      passwordHash,
      college: "Sacred Heart College (Autonomous), Tirupattur",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Admin account setup successfully! You can now log in.",
    credentials: {
      email: user.email,
      password: password,
      role: user.role,
    },
  });
}

// GET /api/setup-admin - Open directly in browser!
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    return await handleSetup(searchParams);
  } catch (error: any) {
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to setup admin." },
      { status: 500 }
    );
  }
}

// POST /api/setup-admin - Programmable setup
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return await handleSetup(undefined, body);
  } catch (error: any) {
    console.error("Error setting up admin:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to setup admin." },
      { status: 500 }
    );
  }
}
