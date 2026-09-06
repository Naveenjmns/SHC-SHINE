"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

import { Trophy, Zap } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDashboardUrl = () => {
    if (!session) return "/login";
    if (session.user.role === "ADMIN") return "/admin";
    if (session.user.role === "COORDINATOR") return "/coordinator";
    return "/dashboard";
  };

  const getDashboardLabel = () => {
    if (!session) return "Dashboard";
    if (session.user.role === "ADMIN") return "Admin Console";
    if (session.user.role === "COORDINATOR") return "Coordinator Console";
    return "Student Portal";
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "py-3 bg-[#0B0A0A]/90 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40"
          : "py-5 bg-transparent"
      }`}
    >
      <div className="container-shine flex items-center justify-between">
        {/* Fest Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group tap-target">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              S
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF6B1A] ring-2 ring-[#0B0A0A] animate-pulse" />
          </div>
          <div>
            <span
              className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              SHINE <span className="hero-wordmark-gradient font-black">26</span>
            </span>
            <p className="text-[10px] text-[#9CA3AF] tracking-wider uppercase hidden sm:block font-medium">
              Sacred Heart College (Autonomous)
            </p>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-7">
          <Link
            href="/#about"
            className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors duration-200"
          >
            About
          </Link>
          <Link
            href="/events"
            className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors duration-200"
          >
            Events Directory
          </Link>
          <Link
            href="/#venue"
            className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors duration-200"
          >
            Venue & Date
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-semibold text-[#D9A441] hover:text-[#F2C94C] transition-colors flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-[#D9A441]" /> Live Results
          </Link>
          <Link
            href="/#contact"
            className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors duration-200"
          >
            Contact
          </Link>
        </div>

        {/* Desktop CTA / Auth */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href={getDashboardUrl()}
                className="btn-ember text-xs !py-2 !px-4 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-white" />
                {getDashboardLabel()}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs font-semibold text-[#9CA3AF] hover:text-rose-400 px-3 py-2 rounded-lg border border-white/10 hover:border-rose-500/30 transition-colors tap-target cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-[#9CA3AF] hover:text-white px-4 py-2 tap-target transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-ember text-xs sm:text-sm !py-2.5 !px-5"
              >
                Register Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger (44px min tap target) */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden tap-target p-2 text-white hover:text-orange-400 focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#141212] border-b border-white/10 px-5 py-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col space-y-2">
            <Link
              href="/#about"
              onClick={() => setMobileOpen(false)}
              className="tap-target justify-start text-base font-medium text-[#9CA3AF] hover:text-white"
            >
              About Fest
            </Link>
            <Link
              href="/events"
              onClick={() => setMobileOpen(false)}
              className="tap-target justify-start text-base font-medium text-[#9CA3AF] hover:text-white"
            >
              Events Directory
            </Link>
            <Link
              href="/#venue"
              onClick={() => setMobileOpen(false)}
              className="tap-target justify-start text-base font-medium text-[#9CA3AF] hover:text-white"
            >
              Venue & Schedule
            </Link>
            <Link
              href="/leaderboard"
              onClick={() => setMobileOpen(false)}
              className="tap-target justify-start text-base font-semibold text-[#D9A441] flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-[#D9A441]" />
              Live Results & Leaderboard
            </Link>
            <Link
              href="/#contact"
              onClick={() => setMobileOpen(false)}
              className="tap-target justify-start text-base font-medium text-[#9CA3AF] hover:text-white"
            >
              Contact Coordinators
            </Link>
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            {session ? (
              <>
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileOpen(false)}
                  className="btn-ember w-full text-center"
                >
                  Go to {getDashboardLabel()}
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="w-full tap-target text-sm font-semibold text-rose-400 border border-rose-500/30 rounded-xl"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-gold-outline w-full text-center text-sm"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-ember w-full text-center text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
