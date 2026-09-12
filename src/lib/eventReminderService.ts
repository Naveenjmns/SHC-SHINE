import prisma from "@/lib/prisma";
import { sendEventReminderEmail } from "@/lib/emailService";
import { formatTimeSafe, formatDateSafe } from "@/lib/dateUtils";
import { logActivity } from "@/lib/activityLogger";

export interface ReminderCheckResult {
  success: boolean;
  timestamp: string;
  eventsScanned: number;
  remindersSent: number;
  errors: number;
  details: Array<{
    eventId: string;
    eventName: string;
    isPrelims: boolean;
    startTime: string;
    recipientsCount: number;
  }>;
}

/**
 * Checks for upcoming competitions starting within the next ~10-15 minutes and
 * automatically dispatches reminder emails to all registered student delegates.
 */
export async function checkAndDispatchEventReminders(options?: {
  forceEventId?: string;
  forceAll?: boolean;
  dryRun?: boolean;
  origin?: string;
}): Promise<ReminderCheckResult> {
  const now = new Date();
  // Window: Events starting between now and the next 15 minutes (targeting the ~10 min mark)
  const windowStart = new Date(now.getTime() - 2 * 60 * 1000); // 2 mins past leeway
  const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins ahead

  const baseUrl = options?.origin || (process.env.NEXTAUTH_URL || "https://shc-shine.up.railway.app").replace(/\/$/, "");

  let remindersSent = 0;
  let errors = 0;
  const details: ReminderCheckResult["details"] = [];

  try {
    // 1. Fetch events
    const whereClause: any = {};
    if (options?.forceEventId) {
      whereClause.id = options.forceEventId;
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        staffCoordinator: {
          select: { name: true, phone: true },
        },
        studentCoordinator: {
          select: { name: true, phone: true },
        },
        coordinator: {
          select: { name: true, phone: true },
        },
      },
    });

    for (const event of events) {
      const isForce = Boolean(options?.forceEventId);

      // Check A: Main Event Starting Soon
      const eventTime = new Date(event.dateTime);
      const isMainEventUpcoming =
        isForce ||
        (eventTime >= windowStart && eventTime <= windowEnd);

      if (isMainEventUpcoming) {
        const registrationWhere: any = {
          eventId: event.id,
        };
        if (!options?.forceAll) {
          registrationWhere.reminderSentAt = null;
        }

        const registrations = await prisma.registration.findMany({
          where: registrationWhere,
          include: {
            user: true,
            delegationMember: true,
            delegation: true,
          },
        });

        if (registrations.length > 0) {
          const formattedStartTime = formatTimeSafe(event.dateTime, {
            hour: "2-digit",
            minute: "2-digit",
          }) || "09:00 AM";

          const formattedDate = formatDateSafe(event.dateTime, {
            month: "short",
            day: "numeric",
          });

          const timeDisplay = `${formattedDate ? `${formattedDate}, ` : ""}${formattedStartTime}`;
          const minutesUntil = Math.max(1, Math.round((eventTime.getTime() - now.getTime()) / 60000));

          const staffIncharge = event.staffCoordinator || event.coordinator;
          const studentIncharge = event.studentCoordinator;

          let eventSentCount = 0;

          for (const reg of registrations) {
            const studentEmail = reg.user.email;
            const studentName = reg.user.name || reg.delegationMember?.name || "Delegate";
            const badgeCode = reg.delegationMember?.badgeCode || `SHINE-${reg.id.slice(-4).toUpperCase()}`;
            const badgeUrl = `${baseUrl}/badge/${badgeCode}`;
            const portalUrl = `${baseUrl}/login?email=${encodeURIComponent(studentEmail)}`;

            if (options?.dryRun) {
              eventSentCount++;
              remindersSent++;
              continue;
            }

            try {
              const sent = await sendEventReminderEmail({
                toEmail: studentEmail,
                studentName,
                collegeName: reg.delegation?.collegeName || reg.user.college || "Delegation",
                eventName: event.name,
                category: event.category,
                isPrelims: false,
                venue: event.venue || "Designated Competition Hall",
                startTime: timeDisplay,
                minutesUntilStart: minutesUntil <= 15 && minutesUntil > 0 ? minutesUntil : 10,
                badgeCode,
                badgeUrl,
                portalUrl,
                rules: event.rules,
                staffCoordinator: staffIncharge ? { name: staffIncharge.name, phone: staffIncharge.phone } : null,
                studentCoordinator: studentIncharge ? { name: studentIncharge.name, phone: studentIncharge.phone } : null,
              });

              if (sent) {
                await prisma.registration.update({
                  where: { id: reg.id },
                  data: { reminderSentAt: new Date() },
                }).catch(() => {});

                eventSentCount++;
                remindersSent++;
              } else {
                errors++;
              }
            } catch (err) {
              console.error(`Error sending reminder to ${studentEmail}:`, err);
              errors++;
            }
          }

          if (eventSentCount > 0) {
            details.push({
              eventId: event.id,
              eventName: event.name,
              isPrelims: false,
              startTime: timeDisplay,
              recipientsCount: eventSentCount,
            });

            await logActivity({
              action: "EVENT_REMINDER_SENT",
              actorName: "System Automation",
              actorEmail: "automation@shc-shine.system",
              actorRole: "ADMIN",
              targetType: "Event",
              targetId: event.id,
              targetTitle: `10-Min Event Reminder: "${event.name}" (${eventSentCount} delegates notified)`,
              details: {
                eventId: event.id,
                eventName: event.name,
                venue: event.venue,
                startTime: timeDisplay,
                notifiedCount: eventSentCount,
              },
            }).catch(() => {});
          }
        }
      }

      // Check B: Prelims Round Starting Soon
      if (event.hasPrelims && event.prelimsDateTime) {
        const prelimsTime = new Date(event.prelimsDateTime);
        const isPrelimsUpcoming =
          isForce ||
          (prelimsTime >= windowStart && prelimsTime <= windowEnd);

        if (isPrelimsUpcoming) {
          const prelimsRegWhere: any = {
            eventId: event.id,
            isPrelimsParticipant: true,
          };
          if (!options?.forceAll) {
            prelimsRegWhere.prelimsReminderSentAt = null;
          }

          const prelimsRegs = await prisma.registration.findMany({
            where: prelimsRegWhere,
            include: {
              user: true,
              delegationMember: true,
              delegation: true,
            },
          });

          if (prelimsRegs.length > 0) {
            const formattedPrelimsTime = formatTimeSafe(event.prelimsDateTime, {
              hour: "2-digit",
              minute: "2-digit",
            }) || "09:00 AM";

            const formattedPrelimsDate = formatDateSafe(event.prelimsDateTime, {
              month: "short",
              day: "numeric",
            });

            const prelimsTimeDisplay = `${formattedPrelimsDate ? `${formattedPrelimsDate}, ` : ""}${formattedPrelimsTime}`;
            const minutesUntilPrelims = Math.max(1, Math.round((prelimsTime.getTime() - now.getTime()) / 60000));

            const staffIncharge = event.staffCoordinator || event.coordinator;
            const studentIncharge = event.studentCoordinator;

            let prelimsSentCount = 0;

            for (const reg of prelimsRegs) {
              const studentEmail = reg.user.email;
              const studentName = reg.user.name || reg.delegationMember?.name || "Delegate";
              const badgeCode = reg.delegationMember?.badgeCode || `SHINE-${reg.id.slice(-4).toUpperCase()}`;
              const badgeUrl = `${baseUrl}/badge/${badgeCode}`;
              const portalUrl = `${baseUrl}/login?email=${encodeURIComponent(studentEmail)}`;

              if (options?.dryRun) {
                prelimsSentCount++;
                remindersSent++;
                continue;
              }

              try {
                const sent = await sendEventReminderEmail({
                  toEmail: studentEmail,
                  studentName,
                  collegeName: reg.delegation?.collegeName || reg.user.college || "Delegation",
                  eventName: event.name,
                  category: event.category,
                  isPrelims: true,
                  venue: event.prelimsVenue || event.venue || "Designated Prelims Hall",
                  startTime: prelimsTimeDisplay,
                  minutesUntilStart: minutesUntilPrelims <= 15 && minutesUntilPrelims > 0 ? minutesUntilPrelims : 10,
                  badgeCode,
                  badgeUrl,
                  portalUrl,
                  rules: event.prelimsRules || event.rules,
                  staffCoordinator: staffIncharge ? { name: staffIncharge.name, phone: staffIncharge.phone } : null,
                  studentCoordinator: studentIncharge ? { name: studentIncharge.name, phone: studentIncharge.phone } : null,
                });

                if (sent) {
                  await prisma.registration.update({
                    where: { id: reg.id },
                    data: { prelimsReminderSentAt: new Date() },
                  }).catch(() => {});

                  prelimsSentCount++;
                  remindersSent++;
                } else {
                  errors++;
                }
              } catch (err) {
                console.error(`Error sending prelims reminder to ${studentEmail}:`, err);
                errors++;
              }
            }

            if (prelimsSentCount > 0) {
              details.push({
                eventId: event.id,
                eventName: event.name,
                isPrelims: true,
                startTime: prelimsTimeDisplay,
                recipientsCount: prelimsSentCount,
              });

              await logActivity({
                action: "EVENT_REMINDER_SENT",
                actorName: "System Automation",
                actorEmail: "automation@shc-shine.system",
                actorRole: "ADMIN",
                targetType: "Event",
                targetId: event.id,
                targetTitle: `10-Min Prelims Reminder: "${event.name}" (${prelimsSentCount} delegates notified)`,
                details: {
                  eventId: event.id,
                  eventName: event.name,
                  venue: event.prelimsVenue || event.venue,
                  startTime: prelimsTimeDisplay,
                  notifiedCount: prelimsSentCount,
                },
              }).catch(() => {});
            }
          }
        }
      }
    }

    return {
      success: true,
      timestamp: now.toISOString(),
      eventsScanned: events.length,
      remindersSent,
      errors,
      details,
    };
  } catch (error: any) {
    console.error("Failed to check and dispatch event reminders:", error);
    return {
      success: false,
      timestamp: now.toISOString(),
      eventsScanned: 0,
      remindersSent,
      errors: errors + 1,
      details,
    };
  }
}
