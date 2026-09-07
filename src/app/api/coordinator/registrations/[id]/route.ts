import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RegistrationStatus } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 403 });
    }

    const { id: registrationId } = await params;
    const body = await req.json();
    const { status, result, score } = body;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            staffCoordinatorId: true,
            studentCoordinatorId: true,
            coordinatorId: true,
            staffCoordinatorEmail: true,
            studentCoordinatorEmail: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            college: true,
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ success: false, message: "Registration not found." }, { status: 404 });
    }

    // Access control: User must be Admin, Staff Coordinator, Student Coordinator, or Legacy Coordinator
    const isManager =
      session.user.role === "ADMIN" ||
      registration.event.staffCoordinatorId === session.user.id ||
      registration.event.studentCoordinatorId === session.user.id ||
      registration.event.coordinatorId === session.user.id ||
      (registration.event.staffCoordinatorEmail &&
        registration.event.staffCoordinatorEmail.toLowerCase() === session.user.email?.toLowerCase()) ||
      (registration.event.studentCoordinatorEmail &&
        registration.event.studentCoordinatorEmail.toLowerCase() === session.user.email?.toLowerCase());

    if (!isManager) {
      return NextResponse.json(
        { success: false, message: "Access forbidden. You do not manage this event." },
        { status: 403 }
      );
    }

    const updateData: { status?: RegistrationStatus; result?: string | null; score?: number | null } = {};
    if (status && Object.values(RegistrationStatus).includes(status)) {
      updateData.status = status as RegistrationStatus;
    }
    if (result !== undefined) {
      updateData.result = result ? result.trim() : null;
    }
    if (score !== undefined) {
      updateData.score = score === "" || score === null ? null : parseFloat(score);
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: updateData,
    });

    // Record activity logs
    if (status && status !== registration.status) {
      const actionType =
        status === "CONFIRMED"
          ? "REGISTRATION_APPROVED"
          : status === "REJECTED"
          ? "REGISTRATION_REJECTED"
          : "REGISTRATION_STATUS_UPDATE";

      await logActivity({
        action: actionType,
        actorId: session.user.id,
        actorName: session.user.name,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Registration",
        targetId: registrationId,
        targetTitle: `${registration.user.name} for ${registration.event.name} marked as ${status}`,
        details: {
          eventName: registration.event.name,
          studentName: registration.user.name,
          studentEmail: registration.user.email,
          previousStatus: registration.status,
          newStatus: status,
        },
      });
    }

    if (result !== undefined && result !== registration.result) {
      await logActivity({
        action: "RESULT_UPDATED",
        actorId: session.user.id,
        actorName: session.user.name,
        actorEmail: session.user.email,
        actorRole: session.user.role,
        targetType: "Event",
        targetId: registration.event.id,
        targetTitle: `Result for ${registration.user.name} set to "${result || "None"}"`,
        details: {
          eventName: registration.event.name,
          studentName: registration.user.name,
          positionAward: result || null,
        },
      });
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    console.error("Error updating registration:", error);
    return NextResponse.json({ success: false, message: "Failed to update registration." }, { status: 500 });
  }
}
