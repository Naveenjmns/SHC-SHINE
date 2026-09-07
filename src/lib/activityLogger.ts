import prisma from "@/lib/prisma";

export interface LogActivityParams {
  action: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  targetTitle?: string | null;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}

export async function logActivity({
  action,
  actorId,
  actorName,
  actorEmail,
  actorRole,
  targetType,
  targetId,
  targetTitle,
  details,
  ipAddress,
}: LogActivityParams) {
  try {
    let detailsString: string | null = null;
    if (typeof details === "string") {
      detailsString = details;
    } else if (details && typeof details === "object") {
      detailsString = JSON.stringify(details);
    }

    return await prisma.activityLog.create({
      data: {
        action,
        actorId: actorId || null,
        actorName: actorName || null,
        actorEmail: actorEmail || null,
        actorRole: actorRole || null,
        targetType: targetType || null,
        targetId: targetId || null,
        targetTitle: targetTitle || null,
        details: detailsString,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to record activity log:", err);
    return null;
  }
}
