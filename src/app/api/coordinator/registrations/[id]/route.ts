import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RegistrationStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "COORDINATOR" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { id: registrationId } = await params;
    const body = await req.json();
    const { status, result } = body;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: { coordinatorId: true },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found." }, { status: 404 });
    }

    // Access control: Coordinator must own the event unless Admin
    if (session.user.role === "COORDINATOR" && registration.event.coordinatorId !== session.user.id) {
      return NextResponse.json(
        { success: false, message: "Access forbidden. You do not manage this event." },
        { status: 403 }
      );
    }

    const updateData: { status?: RegistrationStatus; result?: string | null } = {};
    if (status && Object.values(RegistrationStatus).includes(status)) {
      updateData.status = status as RegistrationStatus;
    }
    if (result !== undefined) {
      updateData.result = result ? result.trim() : null;
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: updateData,
    });

    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ success: false, message: "Failed to update registration." }, { status: 500 });
  }
}
