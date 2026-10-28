"use client";

import { useEffect, useState } from "react";
import { Clock, Radio } from "lucide-react";
import { parseDateSafe, formatDateSafe, formatTimeSafe } from "@/lib/dateUtils";

interface CountdownTimerProps {
  targetDate?: Date | string | null;
  eventDateText?: string;
  /** Display name used in the "underway" banner (e.g. festTitle(edition)); generic when omitted */
  eventName?: string;
}

export default function CountdownTimer({
  targetDate = null,
  eventDateText,
  eventName,
}: CountdownTimerProps) {
  // Initialize with static values to avoid hydration mismatch.
  // Date.now() differs between server (ISR build time) and client (page load time),
  // so we must NOT call it during useState initialization.
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isLive: false,
  });
  const [mounted, setMounted] = useState(false);

  const parsedTargetDate = targetDate ? parseDateSafe(targetDate) : null;
  const hasValidTarget = !!parsedTargetDate && !isNaN(parsedTargetDate.getTime());

  const getFormattedDateText = () => {
    if (eventDateText) return eventDateText;
    if (!hasValidTarget || !parsedTargetDate) return "Date to be announced";
    try {
      const datePart = formatDateSafe(parsedTargetDate, { day: "2-digit", month: "2-digit", year: "numeric" });
      const timePart = formatTimeSafe(parsedTargetDate, { hour: "2-digit", minute: "2-digit", hour12: true });
      return `${datePart.replace(/\//g, "-")} ${timePart}`;
    } catch {
      return "Date to be announced";
    }
  };

  const displayDateText = getFormattedDateText();

  useEffect(() => {
    const calculateTimeLeft = () => {
      const parsedTarget = targetDate ? parseDateSafe(targetDate) : null;
      if (!parsedTarget || isNaN(parsedTarget.getTime())) {
        // No configured date: keep the countdown hidden instead of counting to a made-up date
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false });
        return;
      }
      const target = parsedTarget.getTime();
      const now = Date.now();
      const diff = target - now;


      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isLive: false });
    };

    calculateTimeLeft();
    setMounted(true);
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatTwoDigits = (num: number) => String(num).padStart(2, "0");

  if (!hasValidTarget) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center gap-2 text-center px-2">
          <Clock className="w-4 h-4 text-accent shrink-0" />
          <span className="text-[15px] font-semibold text-ink-muted">
            {eventDateText || "Date to be announced"}
          </span>
        </div>
      </div>
    );
  }

  if (timeLeft.isLive) {
    return (
      <div className="w-full rounded-2xl bg-accent text-accent-ink p-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          Live now
        </div>
        <h3 className="mt-3 text-xl sm:text-2xl leading-tight font-bold text-accent-ink flex items-center justify-center gap-2 break-words">
          <Radio className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
          {eventName ? `${eventName} is underway` : "The fest is underway"}
        </h3>
        <p className="text-[15px] opacity-90 mt-1">Started {displayDateText}</p>
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ];

  return (
    <div className="w-full" aria-live="off">
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[15px] font-semibold text-ink">Starts in</span>
        <span className="text-sm font-medium text-ink-muted tabular-nums">{displayDateText}</span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {units.map((unit, idx) => {
          const isSeconds = idx === units.length - 1;
          return (
            <div
              key={unit.label}
              className={`rounded-[10px] py-3 text-center ${
                isSeconds ? "bg-accent text-accent-ink" : "bg-surface-raised text-ink"
              }`}
            >
              <div
                className="text-2xl sm:text-3xl font-bold tabular-nums leading-none"
                style={{ fontFamily: "var(--font-sans)" }}
                suppressHydrationWarning
              >
                {mounted ? formatTwoDigits(unit.value) : "--"}
              </div>
              <div
                className={`text-xs font-semibold mt-1.5 ${
                  isSeconds ? "text-accent-ink/85" : "text-ink-muted"
                }`}
              >
                {unit.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
