"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  GraduationCap,
  Utensils,
  User,
  QrCode,
  ArrowRight,
  Trophy,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui";

interface ProfileRoleSummaryCardProps {
  role: "STUDENT" | "COORDINATOR" | "FOOD_COORDINATOR" | "ADMIN";
  stats: any;
  name: string;
}

export default function ProfileRoleSummaryCard({
  role,
  stats,
  name,
}: ProfileRoleSummaryCardProps) {
  const getRoleHeader = () => {
    switch (role) {
      case "ADMIN":
        return {
          title: "Executive Fest Administrator",
          description: "Full access to settings, institution branding, editions, and participant registrations.",
          icon: Shield,
          badgeColor: "bg-danger-surface text-danger-ink border-danger-border",
          link: "/admin",
          linkLabel: "Open Executive Console",
        };
      case "COORDINATOR":
        return {
          title: "Arena Event Coordinator",
          description: "Manage delegate check-ins, arena rosters, and score evaluations for your assigned competitions.",
          icon: GraduationCap,
          badgeColor: "bg-accent-muted text-accent-strong border-transparent",
          link: "/coordinator",
          linkLabel: "Open Coordinator Hub",
        };
      case "FOOD_COORDINATOR":
        return {
          title: "Dining Hall & Food Committee",
          description: "Scan meal tokens, track dietary distributions, and monitor catering capacity.",
          icon: Utensils,
          badgeColor: "bg-success-surface text-success-ink border-success-border",
          link: "/food",
          linkLabel: "Open Food Scanner Hub",
        };
      default:
        return {
          title: "Registered Fest Delegate",
          description: "Access your digital QR pass, view registered arenas, and track your festival schedule.",
          icon: User,
          badgeColor: "bg-surface-raised text-ink border-border",
          link: "/dashboard",
          linkLabel: "Open Student Dashboard",
        };
    }
  };

  const meta = getRoleHeader();
  const Icon = meta.icon;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 shadow-card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-ink">{meta.title}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}>
                {role}
              </span>
            </div>
            <p className="text-sm text-ink-muted mt-0.5 max-w-lg">
              {meta.description}
            </p>
          </div>
        </div>

        <Link href={meta.link}>
          <Button variant="outline" size="sm" className="text-sm gap-1.5 shrink-0">
            <span>{meta.linkLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Role specific quick stats */}
      {role === "STUDENT" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 bg-surface-raised rounded-xl border border-border">
            <div className="text-sm font-medium text-ink-muted">
              Registered Arenas
            </div>
            <div className="text-lg font-bold tabular-nums text-ink mt-0.5">
              {stats?.totalRegistrations ?? 0}
            </div>
          </div>

          <div className="p-3 bg-surface-raised rounded-xl border border-border">
            <div className="text-sm font-medium text-ink-muted">
              Confirmed Status
            </div>
            <div className="text-lg font-bold tabular-nums text-success mt-0.5">
              {stats?.confirmedCount ?? 0}
            </div>
          </div>

          <div className="p-3 bg-surface-raised rounded-xl border border-border">
            <div className="text-sm font-medium text-ink-muted">
              Desk Attendance
            </div>
            <div className="text-lg font-bold text-ink mt-0.5">
              {stats?.eventCheckedIn ? "Checked In" : "Pending"}
            </div>
          </div>

          <div className="p-3 bg-surface-raised rounded-xl border border-border">
            <div className="text-sm font-medium text-ink-muted">
              Meal Token
            </div>
            <div className="text-lg font-bold text-ink mt-0.5">
              {stats?.foodTokenClaimed ? "Claimed" : "Available"}
            </div>
          </div>
        </div>
      )}

      {/* Digital QR Badge shortcut for student */}
      {role === "STUDENT" && stats?.badgeCode && (
        <div className="pt-2 flex items-center justify-between p-3.5 bg-surface-raised rounded-xl border border-border">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-accent" />
            <div>
              <div className="text-sm font-bold text-ink">
                Digital Festival ID Badge
              </div>
              <div className="font-mono text-xs text-ink-muted">
                {stats.badgeCode}
              </div>
            </div>
          </div>

          <Link href={`/badge/${stats.badgeCode}`} target="_blank">
            <Button variant="secondary" size="sm" className="text-sm gap-1">
              <span>View Badge Pass</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Awards won if any */}
      {role === "STUDENT" && stats?.wonAwards && stats.wonAwards.length > 0 && (
        <div className="pt-2">
          <div className="text-sm font-bold text-ink flex items-center gap-1.5 mb-2">
            <Trophy className="w-4 h-4 text-gold" />
            <span>Honors & Awards ({stats.wonAwards.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.wonAwards.map((a: any, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-full bg-gold-muted text-gold-ink text-sm font-semibold flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-gold" />
                <span>{a.event}: {a.result}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

