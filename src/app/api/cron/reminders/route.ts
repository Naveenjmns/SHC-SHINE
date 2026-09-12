import { NextResponse } from "next/server";
import { checkAndDispatchEventReminders } from "@/lib/eventReminderService";
import { startReminderScheduler } from "@/lib/reminderScheduler";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reminders
 * Periodic or on-demand check for events starting in ~10 minutes.
 * Can be triggered by external cron, Vercel cron, Railway cron, or coordinator action.
 */
export async function GET(req: Request) {
  try {
    startReminderScheduler();
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, enforce authorization
    if (cronSecret && secret !== cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ success: false, message: "Unauthorized cron trigger." }, { status: 401 });
      }
    }

    const forceEventId = searchParams.get("forceEventId") || undefined;
    const forceAll = searchParams.get("forceAll") === "true";
    const dryRun = searchParams.get("dryRun") === "true";

    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protocol = hostHeader.includes("localhost") ? "http" : "https";
    const origin = process.env.NEXTAUTH_URL
      ? process.env.NEXTAUTH_URL.replace(/\/$/, "")
      : `${protocol}://${hostHeader}`;

    const result = await checkAndDispatchEventReminders({
      forceEventId,
      forceAll,
      dryRun,
      origin,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cron reminder error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/cron/reminders
 * Also supports POST requests with body or query params.
 */
export async function POST(req: Request) {
  return GET(req);
}
