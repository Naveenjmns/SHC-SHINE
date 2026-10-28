import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, RegistrationStatus } from "@prisma/client";
import { logActivity } from "@/lib/activityLogger";
import { generateBadgeCode, generateFoodTokenCode, generateEventPassQr, generateFoodTokenQr } from "@/lib/badgeService";
import { sendDelegateRegistrationEmail, sendCoordinatorRegistrationAlert } from "@/lib/emailService";
import { getActiveEdition } from "@/lib/eventService";
import { checkRateLimit, sanitizeString, isValidEmail, sanitizeToTenDigitPhone, getClientIp, getAppOrigin, buildSecureErrorResponse } from "@/lib/security";

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
    const collegeName = sanitizeString(body.collegeName || body.college, 200);
    const department = sanitizeString(body.department, 200);
    const teamName = sanitizeString(body.teamName, 200);
    let teamLead = body.teamLead && typeof body.teamLead === "object" ? body.teamLead : null;
    const staffIncharge =
      body.staffIncharge && typeof body.staffIncharge === "object"
        ? {
            name: sanitizeString(body.staffIncharge.name, 100),
            email: sanitizeString(body.staffIncharge.email, 254),
            phone: body.staffIncharge.phone ? sanitizeToTenDigitPhone(body.staffIncharge.phone) : "",
          }
        : null;
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

    if (staffIncharge?.email && !isValidEmail(staffIncharge.email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address for the staff in-charge." },
        { status: 400 }
      );
    }

    // Validate members & prelims nomination rules
    const prelimsNominationCountMap = new Map<string, number>();

    const seenEmails = new Set<string>();
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m || typeof m !== "object") {
        return NextResponse.json(
          { success: false, message: `Delegate #${i + 1} is invalid.` },
          { status: 400 }
        );
      }
      // SECURITY: Sanitize member inputs
      m.name = sanitizeString(m.name, 100);
      m.email = sanitizeString(m.email, 254);
      m.phone = sanitizeToTenDigitPhone(m.phone);

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
      if (m.phone.length < 10 || !/^[6-9]\d{9}$/.test(m.phone)) {
        return NextResponse.json(
          { success: false, message: `Invalid mobile number for delegate "${m.name}". Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.` },
          { status: 400 }
        );
      }
      if (!m.eventIds || !Array.isArray(m.eventIds) || m.eventIds.length === 0) {
        return NextResponse.json(
          { success: false, message: `Please select at least one event for delegate "${m.name}".` },
          { status: 400 }
        );
      }
      // Enforce limit: maximum 2 events per participant/delegate
      if (m.eventIds.length > 2) {
        return NextResponse.json(
          { success: false, message: `Delegate "${m.name}" can select at most 2 competitions.` },
          { status: 400 }
        );
      }

      const normalizedEmail = m.email.toLowerCase();
      if (seenEmails.has(normalizedEmail)) {
        return NextResponse.json(
          { success: false, message: `The email "${m.email}" is used for more than one delegate.` },
          { status: 400 }
        );
      }
      seenEmails.add(normalizedEmail);

      if (m.eventIds.some((id) => typeof id !== "string")) {
        return NextResponse.json(
          { success: false, message: `Invalid competition selection for delegate "${m.name}".` },
          { status: 400 }
        );
      }

      if (m.prelimsEventIds !== undefined && !Array.isArray(m.prelimsEventIds)) {
        m.prelimsEventIds = [];
      }
      if (m.prelimsEventIds && m.prelimsEventIds.some((id) => !m.eventIds.includes(id))) {
        return NextResponse.json(
          { success: false, message: `Delegate "${m.name}" can only be nominated for the prelims of competitions they are registered for.` },
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

    // Team lead must be one of the validated delegates; otherwise default to the first delegate
    const requestedLeadEmail =
      teamLead && typeof teamLead.email === "string" ? teamLead.email.toLowerCase().trim() : "";
    const leadMember = members.find((m) => m.email.toLowerCase() === requestedLeadEmail) || members[0];
    teamLead = { name: leadMember.name, email: leadMember.email, phone: leadMember.phone };

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
      where: {
        id: { in: allEventIds },
        OR: [{ editionId }, { editionId: null }],
      },
      include: {
        staffCoordinator: { select: { id: true, name: true, email: true, phone: true } },
        studentCoordinator: { select: { id: true, name: true, email: true, phone: true } },
        coordinator: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    const eventMap = new Map(eventsInDb.map((e) => [e.id, e]));

    const unknownEventIds = allEventIds.filter((id) => !eventMap.has(id));
    if (unknownEventIds.length > 0) {
      return NextResponse.json(
        { success: false, message: "One or more selected competitions are not available for this edition. Please refresh and try again." },
        { status: 400 }
      );
    }

    // SECURITY: Public registration must never attach to, or set credentials on, staff accounts.
    // This also blocks pre-registering an event coordinator's email to inherit their event access.
    const memberEmails = members.map((m) => m.email.toLowerCase().trim());
    const [existingUsers, coordinatorEmailEvents] = await Promise.all([
      prisma.user.findMany({ where: { email: { in: memberEmails } } }),
      prisma.event.findFirst({
        where: {
          OR: [
            { staffCoordinatorEmail: { in: memberEmails, mode: "insensitive" } },
            { studentCoordinatorEmail: { in: memberEmails, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      }),
    ]);
    const existingUserMap = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));
    if (coordinatorEmailEvents || existingUsers.some((u) => u.role !== Role.STUDENT)) {
      return NextResponse.json(
        { success: false, message: "One of the delegate email addresses belongs to a staff account and cannot be used for delegate registration." },
        { status: 400 }
      );
    }

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

    // Origin for QR verification URLs & Student Portal links
    const origin = getAppOrigin(req);

    const isVegOnlyPolicy = activeEdition?.mealOptions === "VEG_ONLY";

    // Pre-compute everything slow (password hashes, codes, QR images) outside the transaction
    const preparedMembers = await Promise.all(
      members.map(async (m, i) => {
        const normalizedEmail = m.email.toLowerCase().trim();
        const foodPref = isVegOnlyPolicy
          ? "VEG"
          : String(m.foodPreference || "VEG").toUpperCase() === "NON_VEG"
          ? "NON_VEG"
          : "VEG";
        const defaultPassword = m.phone.trim();
        const existingUser = existingUserMap.get(normalizedEmail) || null;
        const badgeCode = generateBadgeCode(activeEdition.edition);
        const foodTokenCode = generateFoodTokenCode();
        const verifyUrl = `${origin}/badge/${badgeCode}`;
        const [passwordHash, qrData, foodQrData] = await Promise.all([
          existingUser ? Promise.resolve(null) : bcrypt.hash(defaultPassword, 10),
          generateEventPassQr({ badgeCode, name: m.name.trim(), college: collegeName.trim(), verifyUrl }),
          generateFoodTokenQr({ foodTokenCode, badgeCode, name: m.name.trim(), foodPreference: foodPref }),
        ]);
        return {
          input: m,
          normalizedEmail,
          isLead: normalizedEmail === teamLead.email.toLowerCase().trim(),
          foodPref,
          // Only newly created accounts get the default password; existing accounts keep theirs
          defaultPassword: existingUser ? null : defaultPassword,
          existingUser,
          passwordHash,
          badgeCode,
          foodTokenCode,
          verifyUrl,
          qrData,
          foodQrData,
        };
      })
    );

    // Create Delegation, accounts, passes and registrations atomically
    const { delegation, memberRecords } = await prisma.$transaction(
      async (tx) => {
        const delegation = await tx.delegation.create({
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

        const memberRecords = [];
        for (const pm of preparedMembers) {
          const m = pm.input;
          let user = pm.existingUser;
          if (!user) {
            user = await tx.user.create({
              data: {
                name: m.name.trim(),
                email: pm.normalizedEmail,
                phone: m.phone.trim(),
                college: collegeName.trim(),
                passwordHash: pm.passwordHash,
                role: Role.STUDENT,
                foodPreference: pm.foodPref,
              },
            });
          } else {
            // SECURITY: never touch credentials of an existing account from a public endpoint
            const updateData: { foodPreference: string; phone?: string; college?: string } = {
              foodPreference: pm.foodPref,
            };
            if (!user.phone && m.phone) updateData.phone = m.phone.trim();
            if (!user.college && collegeName) updateData.college = collegeName.trim();
            await tx.user.update({ where: { id: user.id }, data: updateData });
          }

          const memberRecord = await tx.delegationMember.create({
            data: {
              delegationId: delegation.id,
              name: m.name.trim(),
              email: pm.normalizedEmail,
              phone: m.phone.trim(),
              isTeamLead: pm.isLead,
              badgeCode: pm.badgeCode,
              foodTokenCode: pm.foodTokenCode,
              eventCheckedIn: false,
              foodTokenClaimed: false,
              foodPreference: pm.foodPref,
              qrData: pm.qrData,
              foodQrData: pm.foodQrData,
            },
          });

          for (const evId of m.eventIds) {
            const ev = eventMap.get(evId)!;
            const isPrelimsNominated = ev.hasPrelims && Array.isArray(m.prelimsEventIds) && m.prelimsEventIds.includes(ev.id);
            await tx.registration.upsert({
              where: { userId_eventId: { userId: user.id, eventId: ev.id } },
              create: {
                userId: user.id,
                eventId: ev.id,
                delegationId: delegation.id,
                delegationMemberId: memberRecord.id,
                status: RegistrationStatus.PENDING,
                isPrelimsParticipant: isPrelimsNominated,
                prelimsStatus: isPrelimsNominated ? "PENDING" : null,
              },
              update: {
                delegationId: delegation.id,
                delegationMemberId: memberRecord.id,
                isPrelimsParticipant: isPrelimsNominated,
                prelimsStatus: isPrelimsNominated ? "PENDING" : null,
              },
            });
          }
          memberRecords.push(memberRecord);
        }
        return { delegation, memberRecords };
      },
      { timeout: 30000 }
    );

    const registeredDelegates = [];
    // Map of eventId -> array of participants entering this event
    const eventParticipantsMap = new Map<string, Array<{ name: string; email: string; phone: string; badgeCode: string }>>();

    for (let i = 0; i < preparedMembers.length; i++) {
      const pm = preparedMembers[i];
      const m = pm.input;
      const memberRecord = memberRecords[i];

      const memberEvents = [];
      for (const evId of m.eventIds) {
        const ev = eventMap.get(evId)!;
        const zoneLabel = ev.venueZoneId
          ? ev.venueZoneId.replace(/^hall-|^lab-|^room-/, "").replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
          : null;
        memberEvents.push({
          name: ev.name,
          category: ev.category,
          venue: ev.venue,
          venueZoneId: ev.venueZoneId || null,
          venueZoneLabel: zoneLabel,
          mapUrl: ev.venueZoneId ? `${origin}/loc/${ev.venueZoneId}` : `${origin}/events`,
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
          email: pm.normalizedEmail,
          phone: m.phone.trim(),
          badgeCode: pm.badgeCode,
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
        badgeUrl: pm.verifyUrl,
        events: memberEvents,
      });

      // Trigger background confirmation email to this delegate with portal credentials & pass link
      sendDelegateRegistrationEmail({
        toEmail: pm.normalizedEmail,
        delegateName: m.name.trim(),
        collegeName: collegeName.trim(),
        teamName: delegation.teamName,
        badgeCode: pm.badgeCode,
        foodTokenCode: pm.foodTokenCode,
        badgeUrl: pm.verifyUrl,
        portalUrl: `${origin}/login`,
        userId: pm.normalizedEmail,
        password: pm.defaultPassword,
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
