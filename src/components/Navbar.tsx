"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ActiveEditionConfig } from "@/lib/eventService";
import { Sparkles, User, LogOut, LayoutDashboard, Monitor, Menu, X } from "lucide-react";

interface NavbarProps {
  edition?: ActiveEditionConfig;
}

export default function Navbar({ edition }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeEdition, setActiveEdition] = useState<ActiveEditionConfig | undefined>(edition);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!activeEdition) {
      fetch("/api/edition/active")
        .then(async (res) => {
          if (!res.ok) return null;
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        })
        .then((data) => {
          if (data?.success && data.edition) {
            setActiveEdition(data.edition);
          }
        })
        .catch(() => {});
    }
  }, [activeEdition]);

  const getDashboardUrl = () => {
    if (!session) return "/login";
    if (session.user.role === "ADMIN") return "/admin";
    if (session.user.role === "COORDINATOR") return "/coordinator";
    if (session.user.role === "FOOD_COORDINATOR") return "/food";
    return "/dashboard";
  };

  const getDashboardLabel = () => {
    if (!session) return "Sign In";
    if (session.user.role === "ADMIN") return "Admin Console";
    if (session.user.role === "COORDINATOR") return "Coordinator Console";
    if (session.user.role === "FOOD_COORDINATOR") return "Food Committee";
    return "Student Portal";
  };

  const eventName = activeEdition?.name || "SHINE";
  const editionYear = activeEdition?.edition || "2026";
  const logoUrl = activeEdition?.logoUrl;
  const navItems = activeEdition?.navItems || [
    { id: "1", label: "About", url: "#about", order: 1, isEnabled: true },
    { id: "2", label: "Schedule", url: "#schedule", order: 2, isEnabled: true },
    { id: "3", label: "Events", url: "#events", order: 3, isEnabled: true },
    { id: "4", label: "Rules", url: "#rules", order: 4, isEnabled: true },
    { id: "5", label: "Stage View", url: "/leaderboard", order: 5, isEnabled: true },
  ];

  return (
    <nav
      suppressHydrationWarning
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,box-shadow] duration-200 border-b ${
        scrolled || mobileOpen
          ? "bg-surface/95 backdrop-blur-md border-border shadow-card"
          : "bg-canvas/0 border-transparent"
      }`}
    >
      <div className="container-shine h-16 flex items-center justify-between gap-6">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 min-h-[44px]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={eventName}
              width={32}
              height={32}
              loading="eager"
              // @ts-ignore
              fetchPriority="high"
              decoding="async"
              className="h-8 w-auto object-contain"
            />
          ) : (
            <div
              suppressHydrationWarning
              className="w-8 h-8 rounded-[8px] bg-accent text-accent-ink flex items-center justify-center font-bold text-base"
            >
              {eventName.charAt(0)}
            </div>
          )}

          <div className="leading-tight">
            <span className="text-lg font-bold text-ink block">
              {eventName} <span className="text-accent">{editionYear}</span>
            </span>
            <span className="text-xs font-medium text-ink-muted block truncate max-w-[150px] sm:max-w-[220px]">
              {activeEdition?.institutionShortName || activeEdition?.institutionName || "College Symposium"}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className="px-3 py-2 rounded-[8px] text-[15px] font-semibold text-ink hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {session ? (
            <>
              <Link
                href="/profile"
                className="w-10 h-10 flex items-center justify-center text-ink hover:text-accent rounded-[8px] hover:bg-surface-raised transition-colors"
                title="My Profile"
                aria-label="My Profile"
              >
                <User className="w-5 h-5" />
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-10 h-10 flex items-center justify-center text-ink-muted hover:text-danger rounded-[8px] hover:bg-surface-raised transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <Link href={getDashboardUrl()} className="btn-primary !min-h-[40px] !py-2 !px-4 !text-[15px]">
                <LayoutDashboard className="w-4 h-4" />
                <span>{getDashboardLabel()}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-2 text-[15px] font-semibold text-ink hover:text-accent transition-colors"
              >
                Log in
              </Link>
              <Link href="/register" className="btn-primary !min-h-[40px] !py-2 !px-4 !text-[15px]">
                Register now
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex md:hidden items-center justify-center text-ink hover:bg-surface-raised rounded-[8px] min-w-[44px] min-h-[44px] cursor-pointer"
          aria-label="Toggle Menu"
          aria-expanded={mobileOpen}
          suppressHydrationWarning
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-border px-4 pt-2 pb-6 max-h-[calc(100dvh-4rem)] overflow-y-auto">
          <div className="divide-y divide-border">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                onClick={() => setMobileOpen(false)}
                className="block text-base font-semibold text-ink hover:text-accent py-3.5"
              >
                {item.label}
              </Link>
            ))}

            <Link
              href="/leaderboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between py-3.5 text-base font-semibold text-ink hover:text-accent"
            >
              <span className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-ink-muted" />
                Stage presentation view
              </span>
              <span className="pill-badge">Auditorium</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                window.dispatchEvent(new Event("trigger-pwa-install"));
              }}
              className="flex items-center justify-between w-full py-3.5 text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent shrink-0" />
                <span>
                  <span className="block text-base font-semibold text-ink">Install the {eventName} app</span>
                  <span className="block text-[15px] text-ink-muted">Offline passes & live results</span>
                </span>
              </span>
              <span className="text-[15px] font-semibold text-accent">Install</span>
            </button>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            {session ? (
              <>
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{getDashboardLabel()}</span>
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline w-full"
                >
                  <User className="w-4 h-4" />
                  <span>My profile & settings</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="min-h-[44px] w-full text-center text-base font-semibold text-danger rounded-[8px] hover:bg-danger-surface transition-colors cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full"
                >
                  Register your delegation
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-outline w-full"
                >
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
