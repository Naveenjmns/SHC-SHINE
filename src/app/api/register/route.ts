import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, RegistrationStatus } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";
import { generateBadgeCode, generateFoodTokenCode, generateEventPassQr, generateFoodTokenQr } from "@/lib/badgeService";
import { sendDelegateRegistrationEmail, sendCoordinatorRegistrationAlert } from "@/lib/emailService";
import { getActiveEdition } from "@/lib/eventService";
import { checkRateLimit, sanitizeString, isValidEmail, isValidPhone, getClientIp, buildSecureErrorResponse } from "@/lib/security";

interface MemberInput {
  name: string;
  email: string;
  phone: string;
  eventIds: string[];
  prelimsEventIds?: string[];
  foodPreference?: "VEG" | "NON_VEG";
}

export async function POST(req: Request) {
  try {
    // SECURITY: Rate limit registration submissions (5 per IP per minute)
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`register:${clientIp}`, 5, 5 / 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many registration attempts. Please wait a moment and try again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)),
          },
        }
      );
    }

    // 1. Check if registrations are currently open
    const activeEdition = await getActiveEdition();
    if (activeEdition && activeEdition.isRegistrationOpen === false) {
      return NextResponse.json(
        {
          success: false,
          isRegistrationOpen: false,
          message:
            activeEdition.registrationClosedNotice ||
            "Registrations are currently closed by the administration. Please contact the event coordinators for assistance.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Support both Delegation format and Single student format
    // SECURITY: Sanitize all user inputs
    let collegeName = sanitizeString(body.collegeName || body.college, 200);
    let department = sanitizeString(body.department, 200);
    let teamName = sanitizeString(body.teamName, 200);
    let teamLead = body.teamLead;
    let staffIncharge = body.staffIncharge || null;
    let members: MemberInput[] = body.members;

    // SECURITY: Limit delegation size to prevent abuse
    if (members && Array.isArray(members) && members.length > 50) {
      return NextResponse.json(
        { success: false, message: "Maximum 50 delegates per registration." },
        { status: 400 }
      );
    }

    // Backward compatibility if single student format submitted
    if (!members && body.name && body.email) {
      members = [
        {
          name: body.name,
          email: body.email,
          phone: body.phone,
          eventIds: body.eventIds || [],
          prelimsEventIds: body.prelimsEventIds || [],
        },
      ];
      teamLead = {
        name: body.name,
        email: body.email,
        phone: body.phone,
      };
    }

    if (!collegeName || !collegeName.trim()) {
      return NextResponse.json(
        { success: false, message: "College/Institution name is required." },
        { status: 400 }
      );
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return NextResponse.json(
        { success: false, message: "Please add at least one student delegate to register." },
        { status: 400 }
      );
    }

    if (!teamLead || !teamLead.name || !teamLead.email || !teamLead.phone) {
      teamLead = {
        name: members[0].name,
        email: members[0].email,
        phone: members[0].phone,
      };
    }

    // Validate members & prelims nomination rules
    const prelimsNominationCountMap = new Map<string, number>();

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      // SECURITY: Sanitize member inputs
      m.name = sanitizeString(m.name, 100);
      m.email = sanitizeString(m.email, 254);
      m.phone = sanitizeString(m.phone, 20);

      if (!m.name || !m.email || !m.phone) {
        return NextResponse.json(
          { success: false, message: `Delegate #${i + 1} is missing required name, email, or mobile number.` },
          { status: 400 }
        );
      }
      if (!isValidEmail(m.email)) {
        return NextResponse.json(
          { success: false, message: `Invalid email address for delegate "${m.name}".` },
          { status: 400 }
        );
      }
      if (!isValidPhone(m.phone)) {
        return NextResponse.json(
          { success: false, message: `Invalid phone number for delegate "${m.name}".` },
          { status: 400 }
        );
      }
      if (!m.eventIds || !Array.isArray(m.eventIds) || m.eventIds.length === 0) {
        return NextResponse.json(
          { success: false, message: `Please select at least one event for delegate "${m.name}".` },
          { status: 400 }
        );
      }
      // SECURITY: Limit events per delegate to prevent abuse
      if (m.eventIds.length > 20) {
        return NextResponse.json(
          { success: false, message: `Maximum 20 events per delegate.` },
          { status: 400 }
        );
      }

      if (m.prelimsEventIds && Array.isArray(m.prelimsEventIds)) {
        for (const pEvId of m.prelimsEventIds) {
          const currentCount = (prelimsNominationCountMap.get(pEvId) || 0) + 1;
          prelimsNominationCountMap.set(pEvId, currentCount);
          if (currentCount > 1) {
            return NextResponse.json(
              { success: false, message: `Only 1 participant per college delegation can be nominated for the Prelims of a competition.` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Verify active edition ID
    const editionId = activeEdition.id && activeEdition.id !== "default-shine" ? activeEdition.id : null;
    if (!editionId) {
      return NextResponse.json(
        { success: false, message: "No active event edition found to register against." },
        { status: 400 }
      );
    }

    // Calculate total delegation fee: Head count * participantFee
    const participantFee = activeEdition.participantFee || 0;
    const totalFee = members.length * participantFee;

    // Collect all event IDs referenced across all members
    const allEventIds = Array.from(new Set(members.flatMap((m) => m.eventIds)));
    const eventsInDb = await prisma.event.findMany({
      where: { id: { in: allEventIds } },
      include: {
        staffCoordinator: { select: { id: true, name: true, email: true, phone: true } },
        studentCoordinator: { select: { id: true, name: true, email: true, phone: true } },
        coordinator: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    const eventMap = new Map(eventsInDb.map((e) => [e.id, e]));

    // Enforce that every event with Prelims round has an assigned delegate
    for (const ev of eventsInDb) {
      if (ev.hasPrelims) {
        const nominatedCount = prelimsNominationCountMap.get(ev.id) || 0;
        if (nominatedCount === 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Competition "${ev.name}" has a Prelims round. Please assign a student delegate to attend the prelims before completing registration.`,
            },
            { status: 400 }
          );
        }
        if (nominatedCount > 1) {
          return NextResponse.json(
            {
              success: false,
              message: `Only 1 student per college delegation can be nominated for the Prelims of "${ev.name}".`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Host domain / origin for QR verification URLs & Student Portal links
    const hostHeader = req.headers.get("host") || "localhost:3000";
    const forwardedProto = req.headers.get("x-forwarded-proto");
    const protocol = forwardedProto || (hostHeader.includes("localhost") ? "http" : "https");
    const origin = process.env.NEXTAUTH_URL
      ? process.env.NEXTAUTH_URL.replace(/\/$/, "")
      : `${protocol}://${hostHeader}`;

    // Create Delegation in Database
    const delegation = await prisma.delegation.create({
      data: {
        editionId,
        collegeName: collegeName.trim(),
        department: department.trim() || null,
        teamName: teamName.trim() || `${collegeName.trim()} Delegation`,
        teamLeadName: teamLead.name.trim(),
        teamLeadEmail: teamLead.email.toLowerCase().trim(),
        teamLeadPhone: teamLead.phone.trim(),
        staffInchargeName: staffIncharge?.name ? staffIncharge.name.trim() : null,
        staffInchargeEmail: staffIncharge?.email ? staffIncharge.email.toLowerCase().trim() : null,
        staffInchargePhone: staffIncharge?.phone ? staffIncharge.phone.trim() : null,
        totalFee,
        paymentStatus: totalFee === 0 ? "PAID" : "PENDING",
      },
    });

    const registeredDelegates = [];
    // Map of eventId -> array of participants entering this event
    const eventParticipantsMap = new Map<string, Array<{ name: string; email: string; phone: string; badgeCode: string }>>();

    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      const normalizedEmail = m.email.toLowerCase().trim();
      const isLead = i === 0 || normalizedEmail === teamLead.email.toLowerCase().trim();

      const foodPref = (m.foodPreference || "VEG").toUpperCase() === "NON_VEG" ? "NON_VEG" : "VEG";

      const defaultPassword = m.phone.trim() || "shine2027";

      // Find or create User account for this student
      let user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        user = await prisma.user.create({
          data: {
            name: m.name.trim(),
            email: normalizedEmail,
            phone: m.phone.trim(),
            college: collegeName.trim(),
            passwordHash,
            role: Role.STUDENT,
            foodPreference: foodPref,
          },
        });
      } else {
        const updateData: any = { foodPreference: foodPref };
        if (!user.phone && m.phone) {
          updateData.phone = m.phone.trim();
        }
        if (!user.college && collegeName) {
          updateData.college = collegeName.trim();
        }
        if (!user.passwordHash) {
          updateData.passwordHash = await bcrypt.hash(defaultPassword, 10);
        }
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        }).catch(() => {});
      }

      // Generate unique badge ID & Food Token
      const badgeCode = generateBadgeCode(activeEdition.edition);
      const foodTokenCode = generateFoodTokenCode(badgeCode);
      const verifyUrl = `${origin}/badge/${badgeCode}`;

      // Generate 2 QR codes: 1 for Event Entry & 1 for Food Token
      const qrData = await generateEventPassQr({
        badgeCode,
        name: m.name.trim(),
        college: collegeName.trim(),
        verifyUrl,
      });

      const foodQrData = await generateFoodTokenQr({
        foodTokenCode,
        badgeCode,
        name: m.name.trim(),
        foodPreference: foodPref,
      });

      // Create DelegationMember record
      const memberRecord = await prisma.delegationMember.create({
        data: {
          delegationId: delegation.id,
          name: m.name.trim(),
          email: normalizedEmail,
          phone: m.phone.trim(),
          isTeamLead: isLead,
          badgeCode,
          foodTokenCode,
          eventCheckedIn: false,
          foodTokenClaimed: false,
          foodPreference: foodPref,
          qrData,
          foodQrData,
        },
      });

      // Register student for their selected competitions
      const memberEvents = [];
      for (const evId of m.eventIds) {
        const ev = eventMap.get(evId);
        if (!ev) continue;

        const isPrelimsNominated = ev.hasPrelims && Array.isArray(m.prelimsEventIds) && m.prelimsEventIds.includes(ev.id);

        const existingReg = await prisma.registration.findUnique({
          where: {
            userId_eventId: {
              userId: user.id,
              eventId: ev.id,
            },
          },
        });

        if (!existingReg) {
          await prisma.registration.create({
            data: {
              userId: user.id,
              eventId: ev.id,
              delegationId: delegation.id,
              delegationMemberId: memberRecord.id,
              status: RegistrationStatus.PENDING,
              isPrelimsParticipant: isPrelimsNominated,
              prelimsStatus: isPrelimsNominated ? "PENDING" : null,
            },
          });
        } else {
          // Update linkage to delegation
          await prisma.registration.update({
            where: { id: existingReg.id },
            data: {
              delegationId: delegation.id,
              delegationMemberId: memberRecord.id,
              isPrelimsParticipant: isPrelimsNominated,
              prelimsStatus: isPrelimsNominated ? "PENDING" : null,
            },
          });
        }

        memberEvents.push({
          name: ev.name,
          category: ev.category,
          venue: ev.venue,
          time: ev.dateTime ? new Date(ev.dateTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : null,
          staffCoordinator: ev.staffCoordinator?.name || ev.coordinator?.name || null,
          studentCoordinator: ev.studentCoordinator?.name || null,
        });

        // Group for coordinator alert
        if (!eventParticipantsMap.has(ev.id)) {
          eventParticipantsMap.set(ev.id, []);
        }
        eventParticipantsMap.get(ev.id)!.push({
          name: m.name.trim(),
          email: normalizedEmail,
          phone: m.phone.trim(),
          badgeCode,
        });
      }

      registeredDelegates.push({
        id: memberRecord.id,
        name: memberRecord.name,
        email: memberRecord.email,
        phone: memberRecord.phone,
        isTeamLead: memberRecord.isTeamLead,
        badgeCode: memberRecord.badgeCode,
        foodTokenCode: memberRecord.foodTokenCode,
        foodPreference: memberRecord.foodPreference,
        qrData: memberRecord.qrData,
        foodQrData: memberRecord.foodQrData,
        eventCheckedIn: memberRecord.eventCheckedIn,
        foodTokenClaimed: memberRecord.foodTokenClaimed,
        badgeUrl: verifyUrl,
        events: memberEvents,
      });

      // Trigger background confirmation email to this delegate with portal credentials & pass link
      sendDelegateRegistrationEmail({
        toEmail: normalizedEmail,
        delegateName: m.name.trim(),
        collegeName: collegeName.trim(),
        teamName: delegation.teamName,
        badgeCode,
        foodTokenCode,
        badgeUrl: verifyUrl,
        portalUrl: `${origin}/login`,
        userId: normalizedEmail,
        password: defaultPassword,
        userPhone: m.phone.trim(),
        events: memberEvents,
      }).catch((e) => console.error("Delegate email error:", e));
    }

    // Trigger coordinator alerts for all affected events
    for (const [evId, participants] of eventParticipantsMap.entries()) {
      const ev = eventMap.get(evId);
      if (!ev) continue;

      const staffIncharge = ev.staffCoordinator || ev.coordinator;
      const studentIncharge = ev.studentCoordinator;

      const coordinatorPortalUrl = `${origin}/coordinator/${ev.id}`;

      // Notify Staff Coordinator
      if (staffIncharge?.email) {
        sendCoordinatorRegistrationAlert({
          coordinatorEmail: staffIncharge.email,
          coordinatorName: staffIncharge.name,
          roleType: "Staff Incharge",
          eventName: ev.name,
          collegeName: delegation.collegeName,
          teamName: delegation.teamName,
          participants,
          staffIncharge: delegation.staffInchargeName ? {
            name: delegation.staffInchargeName,
            email: delegation.staffInchargeEmail,
            phone: delegation.staffInchargePhone,
          } : null,
          coordinatorPortalUrl,
        }).catch((e) => console.error("Coordinator alert error (staff):", e));
      }

      // Notify Student Coordinator
      if (studentIncharge?.email && studentIncharge.email !== staffIncharge?.email) {
        sendCoordinatorRegistrationAlert({
          coordinatorEmail: studentIncharge.email,
          coordinatorName: studentIncharge.name,
          roleType: "Student Incharge",
          eventName: ev.name,
          collegeName: delegation.collegeName,
          teamName: delegation.teamName,
          participants,
          staffIncharge: delegation.staffInchargeName ? {
            name: delegation.staffInchargeName,
            email: delegation.staffInchargeEmail,
            phone: delegation.staffInchargePhone,
          } : null,
          coordinatorPortalUrl,
        }).catch((e) => console.error("Coordinator alert error (student):", e));
      }
    }

    // Record comprehensive Activity Log
    await logActivity({
      action: "REGISTRATION_CREATED",
      actorName: delegation.teamLeadName,
      actorEmail: delegation.teamLeadEmail,
      actorRole: "STUDENT",
      targetType: "Delegation",
      targetId: delegation.id,
      targetTitle: `Delegation Registered: "${delegation.collegeName}" (${registeredDelegates.length} delegates)`,
      details: {
        collegeName: delegation.collegeName,
        teamName: delegation.teamName,
        delegateCount: registeredDelegates.length,
        totalFee,
        eventsEntered: Array.from(eventParticipantsMap.keys()).map((id) => eventMap.get(id)?.name || id),
        staffIncharge: delegation.staffInchargeName || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Delegation successfully registered with ${registeredDelegates.length} student delegate(s)!`,
      delegation: {
        id: delegation.id,
        collegeName: delegation.collegeName,
        department: delegation.department,
        teamName: delegation.teamName,
        teamLeadName: delegation.teamLeadName,
        staffInchargeName: delegation.staffInchargeName,
        totalFee,
        paymentStatus: delegation.paymentStatus,
      },
      delegates: registeredDelegates,
    });
  } catch (error: any) {
    // SECURITY: Never expose internal error details to the client
    const secureError = buildSecureErrorResponse(
      error,
      "POST /api/register",
      "An unexpected error occurred during registration. Please try again."
    );
    return NextResponse.json(
      { success: false, message: secureError.message },
      { status: 500 }
    );
  }
}
