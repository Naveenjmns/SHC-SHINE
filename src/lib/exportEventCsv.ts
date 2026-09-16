/**
 * Utility for exporting individual event participant rosters in standard SHINE'26 CSV format.
 *
 * CSV Specification:
 * - Row 1: Merged / collided event banner spanning 10 columns:
 *   EVENT: [Name] | Category: [Category] | Venue: [Venue] | Time: [Time] | Total Delegates: [Count]
 * - Row 2: Column Headers:
 *   S.No, College Name, Student Name, Email, Phone Number, Status, Attendance, Score, Result, Registration Date
 * - Rows 3+: Participants grouped by College Name (College Name printed once per college group,
 *   subsequent student rows have blank College Name for clean visual grouping).
 * - Prefixed with \uFEFF (UTF-8 BOM) for flawless opening in Microsoft Excel without character encoding issues.
 * - Filename: [EventName]_Participants.csv
 */

export interface EventCsvMetadata {
  id?: string;
  name: string;
  category?: string;
  venue?: string | null;
  dateTime?: Date | string | null;
}

export interface EventCsvRegistration {
  id: string;
  status: string;
  attended?: boolean;
  score?: number | string | null;
  result?: string | null;
  createdAt: string | Date;
  user: {
    name: string;
    email: string;
    phone?: string | null;
    college?: string | null;
  };
  delegation?: {
    collegeName?: string | null;
    teamName?: string | null;
  } | null;
  delegationMember?: {
    eventCheckedIn?: boolean;
    badgeCode?: string | null;
  } | null;
}

/**
 * Generates the formatted CSV content for an event's participants.
 */
export function generateEventParticipantsCsv(
  event: EventCsvMetadata,
  registrations: EventCsvRegistration[]
): string {
  // Helper to safely escape CSV cell values
  const esc = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    return `"${String(val).replace(/"/g, '""')}"`;
  };

  const eventCategoryLabel =
    event.category === "ON_STAGE"
      ? "On-Stage Arena"
      : event.category === "OFF_STAGE"
      ? "Off-Stage Challenge"
      : event.category || "General Competition";

  const eventBanner = [
    `EVENT: ${event.name}`,
    `Category: ${eventCategoryLabel}`,
    event.venue ? `Venue: ${event.venue}` : null,
    event.dateTime ? `Time: ${new Date(event.dateTime).toLocaleString()}` : null,
    `Total Delegates: ${registrations.length}`,
  ]
    .filter(Boolean)
    .join(" | ");

  // 1st Row: Merged event metadata banner across 10 columns
  const row1 = [esc(eventBanner), '""', '""', '""', '""', '""', '""', '""', '""', '""'].join(",");

  // 2nd Row: Column Headers
  const row2 = [
    esc("S.No"),
    esc("College Name"),
    esc("Student Name"),
    esc("Email"),
    esc("Phone Number"),
    esc("Status"),
    esc("Attendance"),
    esc("Score"),
    esc("Result"),
    esc("Registration Date"),
  ].join(",");

  // Group participants by College Name
  const collegeMap = new Map<string, EventCsvRegistration[]>();
  for (const r of registrations) {
    const college = (r.delegation?.collegeName || r.user.college || "Independent / Individual").trim();
    if (!collegeMap.has(college)) {
      collegeMap.set(college, []);
    }
    collegeMap.get(college)!.push(r);
  }

  let serialNo = 1;
  const participantRows: string[] = [];

  // Sort colleges alphabetically
  const sortedColleges = Array.from(collegeMap.keys()).sort((a, b) => a.localeCompare(b));

  for (const collegeName of sortedColleges) {
    const collegeMembers = collegeMap.get(collegeName) || [];
    collegeMembers.forEach((r, idx) => {
      // Show College Name once on the first student's row; leave blank on subsequent rows
      const collegeCell = idx === 0 ? collegeName : "";
      const isAttended = Boolean(r.attended || r.delegationMember?.eventCheckedIn);
      const row = [
        esc(serialNo++),
        esc(collegeCell),
        esc(r.user.name),
        esc(r.user.email),
        esc(r.user.phone || "—"),
        esc(r.status),
        esc(isAttended ? "PRESENT" : "ABSENT"),
        esc(r.score !== null && r.score !== undefined ? r.score : ""),
        esc(r.result || ""),
        esc(new Date(r.createdAt).toLocaleString()),
      ];
      participantRows.push(row.join(","));
    });
  }

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  return "\uFEFF" + [row1, row2, ...participantRows].join("\r\n");
}

/**
 * Triggers a browser download of the CSV content.
 */
export function triggerCsvDownload(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads participants CSV for a given event.
 * If eventData and registrationsData are not provided, it fetches them via the coordinator event endpoint.
 */
export async function downloadEventParticipantsCSV({
  eventId,
  eventName,
  eventData,
  registrationsData,
}: {
  eventId: string;
  eventName?: string;
  eventData?: EventCsvMetadata;
  registrationsData?: EventCsvRegistration[];
}): Promise<{ count: number; filename: string }> {
  let event = eventData;
  let registrations = registrationsData;

  if (!event || !registrations) {
    const res = await fetch(`/api/coordinator/events/${eventId}/registrations`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || "Failed to load event participants.");
    }
    event = data.event;
    registrations = data.registrations || [];
  }

  const resolvedEventName = event?.name || eventName || "Event";
  const csvContent = generateEventParticipantsCsv(
    event || { name: resolvedEventName },
    registrations || []
  );

  const cleanFilename = `${resolvedEventName.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_")}_Participants.csv`;
  triggerCsvDownload(cleanFilename, csvContent);

  return { count: (registrations || []).length, filename: cleanFilename };
}
