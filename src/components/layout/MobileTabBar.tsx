"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  CalendarDays,
  Trophy,
  User,
  LayoutDashboard,
  Users,
  FileBarChart,
  ScanLine,
  ClipboardList,
  MapPin,
} from "lucide-react";

type Tab = { label: string; href: string; icon: React.ReactNode; match?: (p: string) => boolean };

const TABS: Record<string, Tab[]> = {
  STUDENT: [
    { label: "Home", href: "/dashboard", icon: <Home /> },
    { label: "Events", href: "/events", icon: <CalendarDays /> },
    { label: "Map", href: "/loc/wp-entrance", icon: <MapPin />, match: (p) => p.startsWith("/loc") },
    { label: "Results", href: "/leaderboard", icon: <Trophy /> },
    { label: "Profile", href: "/profile", icon: <User /> },
  ],
  COORDINATOR: [
    { label: "Events", href: "/coordinator", icon: <ClipboardList />, match: (p) => p.startsWith("/coordinator") },
    { label: "Schedule", href: "/events", icon: <CalendarDays /> },
    { label: "Results", href: "/leaderboard", icon: <Trophy /> },
    { label: "Profile", href: "/profile", icon: <User /> },
  ],
  FOOD_COORDINATOR: [
    { label: "Scanner", href: "/food", icon: <ScanLine /> },
    { label: "Events", href: "/events", icon: <CalendarDays /> },
    { label: "Profile", href: "/profile", icon: <User /> },
  ],
  ADMIN: [
    { label: "Console", href: "/admin", icon: <LayoutDashboard />, match: (p) => p === "/admin" },
    { label: "Events", href: "/admin/events", icon: <CalendarDays /> },
    { label: "Users", href: "/admin/users", icon: <Users /> },
    { label: "Reports", href: "/admin/reports", icon: <FileBarChart /> },
    { label: "Profile", href: "/profile", icon: <User /> },
  ],
};

// Full-screen flows where a tab bar would get in the way
const HIDDEN_PREFIXES = ["/login", "/register", "/badge", "/maintenance", "/error-preview", "/design"];

/** Fixed bottom navigation for signed-in users on phones and tablets */
export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;
  const tabs = role ? TABS[role] : undefined;

  if (!tabs || pathname === "/" || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <>
      {/* Spacer so page content and footer are never hidden behind the bar */}
      <div aria-hidden="true" className="h-[calc(4.5rem+env(safe-area-inset-bottom))] md:hidden" />
      <nav
        aria-label="Primary"
        className="mobile-tab-bar md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border safe-bottom"
      >
        <ul className="grid h-[4.5rem]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => {
            const active = tab.match ? tab.match(pathname) : pathname === tab.href || pathname.startsWith(tab.href + "/");
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={`h-full flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors [&_svg]:size-6 ${
                    active ? "text-accent" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-14 h-8 rounded-full transition-colors ${
                      active ? "bg-accent-muted" : ""
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
