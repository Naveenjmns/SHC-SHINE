import { checkAndDispatchEventReminders } from "@/lib/eventReminderService";

declare global {
  // eslint-disable-next-line no-var
  var __shineReminderInterval: NodeJS.Timeout | null | undefined;
}

/**
 * Starts the autonomous in-process background worker that runs every 60 seconds
 * to check for events starting within ~10 minutes and dispatches reminder emails.
 */
export function startReminderScheduler(intervalMs = 60 * 1000) {
  if (globalThis.__shineReminderInterval) {
    return;
  }

  console.log(
    `[Event Reminder Scheduler] Autonomous background runner active (scanning every ${intervalMs / 1000}s)...`
  );

  // Run initial check after a 5-second stabilization delay
  setTimeout(() => {
    checkAndDispatchEventReminders().catch((err) =>
      console.error("[Event Reminder Scheduler] Initial run error:", err)
    );
  }, 5000);

  // Periodic check
  globalThis.__shineReminderInterval = setInterval(() => {
    checkAndDispatchEventReminders().catch((err) =>
      console.error("[Event Reminder Scheduler] Periodic run error:", err)
    );
  }, intervalMs);
}

export function stopReminderScheduler() {
  if (globalThis.__shineReminderInterval) {
    clearInterval(globalThis.__shineReminderInterval);
    globalThis.__shineReminderInterval = null;
    console.log("[Event Reminder Scheduler] Background runner stopped.");
  }
}
