"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, BookOpen, Layers } from "lucide-react";
import ColorMatrix from "./components/ColorMatrix";
import TypographyMatrix from "./components/TypographyMatrix";
import ComponentPreviewMatrix from "./components/ComponentPreviewMatrix";
import ThemePlayground from "./components/ThemePlayground";
import Footer from "@/components/Footer";

export default function DesignSystemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/design");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // Admin Role Guard
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="max-w-md w-full p-6 rounded-[12px] border border-border bg-surface text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-danger-surface border border-danger-border flex items-center justify-center mx-auto text-danger">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-ink">Admin Access Required</h1>
          <p className="text-sm text-ink-muted">
            The Design System and Token Matrix route is restricted to administrative personnel.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-4 rounded-[8px] bg-accent text-accent-ink font-semibold text-sm hover:bg-accent-hover transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col">
      {/* Sticky Admin Sub-Header */}
      <header className="sticky top-0 z-sticky bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-[8px] border border-border hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors"
              title="Return to Admin Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent-muted text-accent font-semibold">
                  v2.0 TOKENS
                </span>
                <h1 className="text-base font-bold text-ink">Design System & Token Matrix</h1>
              </div>
              <p className="text-xs text-ink-muted hidden sm:block">
                Single Accent (#FF6B1A) • WCAG AA Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Naveenjmns/SHC-SHINE/blob/redesign/ui-v2/docs/DESIGN_SYSTEM.md"
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 rounded-[8px] border border-border bg-surface hover:bg-surface-raised text-xs font-medium text-ink flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" /> Spec Doc
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* Intro Hero Banner */}
        <div className="p-6 rounded-[12px] border border-border bg-surface-raised flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              <h2 className="text-lg font-bold text-ink">Design System Architecture</h2>
            </div>
            <p className="text-sm text-ink-muted max-w-2xl">
              Strict 4/8 spacing rhythm, single accent system (#FF6B1A), Bricolage Grotesque display + Inter UI typography,
              and 1px hairline elevation borders. Fully dynamic and overridable per edition.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-surface text-success-ink border border-success-border">
              WCAG AA Verified
            </span>
          </div>
        </div>

        {/* 1. Interactive Theme Playground & Contrast Calculator */}
        <ThemePlayground />

        {/* 2. Color Swatches Matrix */}
        <ColorMatrix />

        {/* 3. Typography Scale Matrix */}
        <TypographyMatrix />

        {/* 4. Component Previews, Radii & Hairline Elevation */}
        <ComponentPreviewMatrix />
      </main>

      <Footer />
    </div>
  );
}
