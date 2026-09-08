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
    return "/dashboard";
  };

  const getDashboardLabel = () => {
    if (!session) return "Sign In";
    if (session.user.role === "ADMIN") return "Admin Console";
    if (session.user.role === "COORDINATOR") return "Coordinator Console";
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#1C1917]/10 shadow-md"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="container-shine flex items-center justify-between">
        {/* Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 group tap-target">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={eventName}
              loading="eager"
              // @ts-ignore
              fetchPriority="high"
              decoding="async"
              className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="relative">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                {eventName.charAt(0)}
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF6B1A] ring-2 ring-[#FAF8F5] animate-pulse" />
            </div>
          )}

          <div>
            <span
              className="text-xl font-extrabold tracking-tight text-[#1C1917] flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              {eventName}{" "}
              <span className="hero-wordmark-gradient font-black">
                {editionYear}
              </span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#57534E] block -mt-1 truncate max-w-[150px] sm:max-w-[240px]">
              {activeEdition?.institutionShortName || activeEdition?.institutionName || "College Symposium"}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-7">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              className="text-xs lg:text-sm font-semibold text-[#44403C] hover:text-[#FF6B1A] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#FF6B1A] after:scale-x-0 hover:after:scale-x-100 after:transition-transform"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#57534E] hover:text-[#FF6B1A] bg-white border border-[#1C1917]/10 px-3 py-2 rounded-xl transition shadow-2xs"
            title="Stage Presentation Mode"
          >
            <Monitor className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Stage View</span>
          </Link>

          {session ? (
            <div className="flex items-center gap-2">
              <Link
                href={getDashboardUrl()}
                className="btn-ember !py-2 !px-4 text-xs font-bold"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{getDashboardLabel()}</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="p-2 text-[#57534E] hover:text-red-600 rounded-xl hover:bg-stone-100 transition tap-target"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs font-bold text-[#1C1917] hover:text-[#FF6B1A] px-3.5 py-2 rounded-xl transition tap-target"
              >
                Login
              </Link>
              <Link href="/register" className="btn-ember !py-2 !px-4 text-xs font-bold">
                Register Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button (44px min tap target) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2.5 text-[#1C1917] hover:bg-stone-100 rounded-xl tap-target"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer with Comprehensive Options & PWA Install */}
      {mobileOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-b border-[#1C1917]/10 px-5 py-5 space-y-3 shadow-xl animate-fade-in max-h-[85vh] overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.url}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-bold text-[#1C1917] hover:text-[#FF6B1A] py-2 border-b border-stone-100"
            >
              {item.label}
            </Link>
          ))}

          {/* Stage View Link */}
          <Link
            href="/leaderboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-between py-2 text-sm font-bold text-[#D97706] hover:text-[#FF6B1A] border-b border-stone-100"
          >
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span>Stage Presentation View</span>
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              Auditorium
            </span>
          </Link>

          {/* PWA Install Button */}
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              window.dispatchEvent(new Event("trigger-pwa-install"));
            }}
            className="tap-target flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/20 text-[#1C1917] text-xs font-bold transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
              <div>
                <div className="font-extrabold">Install SHINE 26 App</div>
                <div className="text-[10px] text-stone-500 font-normal">Fast offline passes & results</div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white px-2 py-0.5 rounded shadow-2xs">
              Install
            </span>
          </button>

          {/* Mobile User Actions */}
          <div className="pt-3 flex flex-col gap-2.5">
            {session ? (
              <>
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileOpen(false)}
                  className="btn-ember w-full text-center py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{getDashboardLabel()}</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="tap-target w-full text-center py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-ember w-full text-center py-2.5 text-xs font-bold"
                >
                  Register Delegation Now
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="tap-target w-full text-center py-2.5 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition"
                >
                  Sign In to Portal
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
