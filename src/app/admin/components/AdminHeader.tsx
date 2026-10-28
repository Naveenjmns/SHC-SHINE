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
    <header className="bg-surface/95 backdrop-blur-md border-b border-border sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0 min-h-[44px]">
          <span className="w-8 h-8 rounded-[8px] bg-accent text-accent-ink flex items-center justify-center font-bold shrink-0">
            S
          </span>
          <span className="leading-tight min-w-0">
            <span className="block text-base font-bold text-ink truncate">
              SHINE <span className="text-accent">{editionNumber}</span>
            </span>
            <span className="block text-xs font-medium text-ink-muted truncate">Admin console</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link
            href="/design"
            target="_blank"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 min-h-[40px] rounded-[8px] text-sm font-semibold text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
          >
            Design system
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCheckIn}
            leftIcon={<QrCode className="text-accent" />}
            aria-label="Open check-in hub"
          >
            <span className="hidden sm:inline">Check-in hub</span>
          </Button>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            aria-label="Sign out"
            className="w-11 h-11 flex items-center justify-center rounded-[8px] text-ink-muted hover:text-danger hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
