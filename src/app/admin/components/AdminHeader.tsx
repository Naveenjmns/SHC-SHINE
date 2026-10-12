"use client";

import React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, QrCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";

interface AdminHeaderProps {
  editionNumber?: string;
  onOpenCheckIn: () => void;
}

export default function AdminHeader({
  editionNumber = "26",
  onOpenCheckIn,
}: AdminHeaderProps) {
  return (
    <header className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold text-sm tracking-tight text-[var(--ink)]">
            SHINE <span className="text-[var(--accent)]">{editionNumber}</span>
          </Link>
          <span className="text-[var(--border)]">/</span>
          <span className="text-xs font-semibold text-[var(--ink)] px-2 py-0.5 rounded-md bg-[var(--surface-raised)] border border-[var(--border)]">
            Executive Console
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/design" target="_blank" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="text-xs text-[var(--ink-muted)] gap-1">
              <span>Design System</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCheckIn}
            className="text-xs gap-1.5"
          >
            <QrCode className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="hidden sm:inline">Check-In Hub</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-[var(--ink-muted)] hover:text-rose-600"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

