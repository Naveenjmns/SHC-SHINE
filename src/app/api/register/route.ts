import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, RegistrationStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, college, password, eventIds } = body;

    // Validation
    if (!name || !email || !college || !phone) {
      return NextResponse.json(
        { success: false, message: "Name, email, phone number, and college are required." },
        { status: 400 }
      );
    }

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please select at least one event to register." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // New student user
      const userPassword = password ? password.trim() : (phone.trim() || "shine2026");
      const passwordHash = await bcrypt.hash(userPassword, 10);

      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          college: college.trim(),
          passwordHash,
          role: Role.STUDENT,
        },
      });
    } else {
      // Update details if missing
      const updateData: { name?: string; phone?: string; college?: string; passwordHash?: string } = {};
      if (!user.name && name) updateData.name = name.trim();
      if (!user.phone && phone) updateData.phone = phone.trim();
      if (!user.college && college) updateData.college = college.trim();
      if (!user.passwordHash && password) {
        updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
      }

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    // Verify events exist
    const validEvents = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
      },
      select: { id: true, name: true, fee: true },
    });

    if (validEvents.length === 0) {
      return NextResponse.json(
        { success: false, message: "None of the selected events were found." },
        { status: 400 }
      );
    }

    // Create registrations
    const registrationResults = [];
    for (const ev of validEvents) {
      const existing = await prisma.registration.findUnique({
        where: {
          userId_eventId: {
            userId: user.id,
            eventId: ev.id,
          },
        },
      });

      if (!existing) {
        const newReg = await prisma.registration.create({
          data: {
            userId: user.id,
            eventId: ev.id,
            status: RegistrationStatus.PENDING,
          },
        });
        registrationResults.push({ eventName: ev.name, status: "CREATED", id: newReg.id });
      } else {
        registrationResults.push({ eventName: ev.name, status: "ALREADY_REGISTERED", id: existing.id });
      }
    }

    const totalFee = validEvents.reduce((sum, e) => sum + e.fee, 0);

    return NextResponse.json({
      success: true,
      message: `Registration submitted successfully for ${registrationResults.length} event(s)!`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        college: user.college,
      },
      totalFee,
      registrations: registrationResults,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred during registration. Please try again." },
      { status: 500 }
    );
  }
}
