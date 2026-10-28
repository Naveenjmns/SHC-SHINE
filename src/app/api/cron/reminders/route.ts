import { NextResponse } from "next/server";
import { checkAndDispatchEventReminders } from "@/lib/eventReminderService";
import { startReminderScheduler } from "@/lib/reminderScheduler";
import { getAppOrigin } from "@/lib/security";
import { timingSafeEqual } from "crypto";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/reminders
 * Periodic or on-demand check for events starting in ~10 minutes.
 * Can be triggered by external cron, Vercel cron, Railway cron, or coordinator action.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cronSecret = process.env.CRON_SECRET;

    // SECURITY: Fail closed in production when CRON_SECRET is missing; in development
    // allow unauthenticated triggers but never the mass re-send options.
    if (!cronSecret) {
      if (process.env.NODE_ENV === "production") {
        console.error("CRON_SECRET is not set; refusing external cron trigger.");
        return NextResponse.json({ success: false, message: "Cron trigger is not configured." }, { status: 503 });
      }
    } else {
      // Header only: a ?secret= query value would be written to proxy/access logs
      const authHeader = req.headers.get("authorization") || "";
      const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
      if (!safeEqual(provided, cronSecret)) {
        return NextResponse.json({ success: false, message: "Unauthorized cron trigger." }, { status: 401 });
      }
    }

    // Only authorised callers may (re)start the in-process scheduler
    startReminderScheduler();

    const forceEventId = cronSecret ? searchParams.get("forceEventId") || undefined : undefined;
    const forceAll = cronSecret ? searchParams.get("forceAll") === "true" : false;
    const dryRun = searchParams.get("dryRun") === "true";

    const origin = getAppOrigin(req);

    const result = await checkAndDispatchEventReminders({
      forceEventId,
      forceAll,
      dryRun,
      origin,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Cron reminder error:", error);
    return NextResponse.json({ success: false, message: "Reminder dispatch failed." }, { status: 500 });
  }
}

/**
 * POST /api/cron/reminders
 * Also supports POST requests with body or query params.
 */
export async function POST(req: Request) {
  return GET(req);
}
