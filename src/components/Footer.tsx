"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Theater, Laptop, Info, X, ShieldCheck, QrCode, Utensils, Award, Sparkles, Building2, ExternalLink, Code2, Layers, Cpu, Mail } from "lucide-react";
import { ActiveEditionConfig } from "@/lib/eventService";

interface FooterProps {
  edition?: ActiveEditionConfig | null;
}

export default function Footer({ edition: initialEdition }: FooterProps) {
  const [edition, setEdition] = useState<ActiveEditionConfig | null>(initialEdition || null);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    if (initialEdition) {
      setEdition(initialEdition);
      return;
    }
    let isMounted = true;
    fetch("/api/edition/active")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && data?.edition) {
          setEdition(data.edition);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [initialEdition]);

  const eventName = edition?.name || "SHINE";
  const editionYear = edition?.edition || "'26";
  const institutionName =
    edition?.institutionName || "SACRED HEART COLLEGE (AUTONOMOUS), TIRUPATTUR";
  const hostDepartment =
    edition?.hostDepartment || "DEPARTMENT OF COMPUTER APPLICATIONS (PG)";
  const contactEmail = edition?.contactEmail || "shine@shctpt.edu";
  const contactPhone = edition?.contactPhone || "+91 4175 240464";
  const location =
    edition?.institutionLocation ||
    edition?.venue ||
    "SGB Main Auditorium, Sacred Heart College (Autonomous), Tirupattur";
  const logoUrl = edition?.logoUrl || "/uploads/1788792011099_SHINE_26_LOGO.png";
  const description =
    edition?.description ||
    `SHINE 26 is the annual intercollegiate flagship symposium organized by ${hostDepartment}, ${institutionName}.`;
  const startDate = edition?.startDate || "2026-09-17T04:00:00.000Z";

  return (
    <footer className="border-t border-[#1C1917] bg-[#1C1917] text-stone-300 text-xs">
      <div className="container-shine py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Logo & Mission */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={eventName}
                  width={32}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-base shadow-sm"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  {eventName.charAt(0)}
                </div>
              )}
              <span
                className="text-lg font-extrabold text-white"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                {eventName} <span className="hero-wordmark-gradient">{editionYear}</span>
              </span>
            </Link>
            <p className="leading-relaxed mb-4 text-stone-400">
              {description}
            </p>
            {startDate && (
              <div className="text-[#D9A441] font-bold">
                {new Date(startDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4
              className="text-sm font-bold text-white uppercase tracking-wider mb-4"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">
                  About {eventName}
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">
                  All Competitions
                </Link>
              </li>
              <li>
                <Link href="/#schedule" className="hover:text-white transition-colors">
                  Schedule & Timeline
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-[#D9A441] hover:text-amber-300 font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <Trophy className="w-3.5 h-3.5 text-[#D9A441]" /> Live Stage Results
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="text-[#FF6B1A] hover:text-orange-400 font-bold transition-colors"
                >
                  Online Registration
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(true)}
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer text-left text-stone-400 hover:text-amber-300 font-semibold pt-1"
                >
                  <Info className="w-3.5 h-3.5 text-[#FF6B1A]" />
                  <span>About the App</span>
                </button>
              </li>
              <li>
                <a
                  href="https://github.com/Naveenjmns/SHC-SHINE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5 text-stone-400 hover:text-stone-200"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>App Repository</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Arenas */}
          <div>
            <h4
              className="text-sm font-bold text-white uppercase tracking-wider mb-4"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Fest Arenas
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/events?category=ON_STAGE"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Theater className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                  <span>On-Stage Competitions & Live Presentations</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/events?category=OFF_STAGE"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <Laptop className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                  <span>Off-Stage Technical & Creative Challenges</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Venue */}
          <div>
            <h4
              className="text-sm font-bold text-white uppercase tracking-wider mb-4"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Reach Us
            </h4>
            <div className="space-y-2 leading-relaxed text-stone-400">
              <div className="text-white font-bold">{institutionName}</div>
              <div>{location}</div>
              <div>
                Email:{" "}
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-[#D9A441] hover:underline font-semibold"
                >
                  {contactEmail}
                </a>
              </div>
              <div>
                Phone:{" "}
                <a
                  href={`tel:${contactPhone}`}
                  className="text-[#D9A441] hover:underline font-semibold"
                >
                  {contactPhone}
                </a>
              </div>
              {edition?.websiteUrl && (
                <div>
                  Web:{" "}
                  <a
                    href={edition.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:underline"
                  >
                    {edition.websiteUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
          <div>
            © {new Date().getFullYear()} {hostDepartment}, {institutionName}. All rights reserved.
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-end">
            <button
              type="button"
              onClick={() => setShowAboutModal(true)}
              className="text-[#D9A441] hover:text-amber-300 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>About the App</span>
            </button>
            <span>•</span>
            <Link href="/login" className="hover:text-white transition-colors">
              Portal Login
            </Link>
            <span>•</span>
            <span className="text-stone-500">SHINE - Symposium Management App</span>
          </div>
        </div>
      </div>

      {/* About the App Modal */}
      {showAboutModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#141212] text-stone-200 rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-800 transform scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2"
                    style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                  >
                    <span>SHINE - Symposium Management App</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-[#FF6B1A] border border-[#FF6B1A]/30">
                      v1.0 LIVE
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Intercollegiate Fest Operating System
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="tap-target p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-5 space-y-5 text-xs text-stone-300">
              {/* Platform Statement */}
              <p className="text-sm leading-relaxed text-stone-200">
                <strong>SHINE - Symposium Management App</strong> is an enterprise-grade platform engineered to orchestrate large-scale intercollegiate symposiums with sub-second QR optical check-ins, automated spot desk revenue tracking, and strict committee role isolation.
              </p>

              {/* Core Modules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <QrCode className="w-4 h-4 text-[#FF6B1A]" />
                    <span>Single-Use QR Gate Passes</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Digital badges generated instantly on registration. Passes remain inactive until spot approval, then expire immediately upon event gate entry to prevent re-use.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <Utensils className="w-4 h-4 text-[#D9A441]" />
                    <span>Food Committee Isolated Portal</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Dedicated meal distribution terminal with camera optical scanning. Strictly restricted to Food Token QR codes (FT-...) with real-time Veg/Non-Veg quota tracking.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <span>Live Stage Results & Leaderboards</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    High-contrast leaderboard display engine optimized for auditorium projectors, stage award modes, and automated institutional championship calculation.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-white text-xs">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Role-Based Committee Isolation</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    Event Coordinators cannot claim meals; Food Committee cannot check in competition arenas. Clear role boundaries protect event integrity.
                  </p>
                </div>
              </div>

              {/* App Version & Platform Overview */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#FF6B1A]" />
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Application Version
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-stone-800 text-stone-200 border border-stone-700 font-bold">
                      v1.0.0 (Release Edition)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Stable Build
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] pt-1">
                  <div className="p-2.5 rounded-xl bg-stone-950/50 border border-stone-800/80">
                    <span className="text-stone-500 block text-[10px]">Edition</span>
                    <span className="text-stone-200 font-bold">SHINE '26</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-950/50 border border-stone-800/80">
                    <span className="text-stone-500 block text-[10px]">Framework</span>
                    <span className="text-stone-200 font-bold">Next.js 16</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-950/50 border border-stone-800/80">
                    <span className="text-stone-500 block text-[10px]">Runtime</span>
                    <span className="text-stone-200 font-bold">React 19 / TS</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-stone-950/50 border border-stone-800/80">
                    <span className="text-stone-500 block text-[10px]">Data Store</span>
                    <span className="text-stone-200 font-bold">PostgreSQL</span>
                  </div>
                </div>
              </div>

              {/* Technologies Used */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#D9A441]" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Technologies Used
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Next.js 16 (App Router)",
                    "React 19",
                    "TypeScript",
                    "PostgreSQL",
                    "Prisma ORM",
                    "Tailwind CSS",
                    "NextAuth.js (RBAC)",
                    "HTML5 Camera Stream",
                    "jsQR Engine",
                    "Canvas QRCode",
                    "Nodemailer SMTP",
                    "Lucide React",
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-stone-800/80 text-stone-300 border border-stone-700/60 hover:border-[#D9A441]/40 hover:text-white transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Developed By */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-900/90 to-stone-950/90 border border-stone-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white text-xs uppercase tracking-wider">
                    Developed By
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Sakthi K */}
                  <a
                    href="https://github.com/Sakthi10122004"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-[#FF6B1A]/50 hover:bg-stone-850 transition-all flex items-center justify-between gap-3 text-left shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:scale-105 transition-transform">
                        SK
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs group-hover:text-[#FF6B1A] transition-colors flex items-center gap-1.5">
                          <span>Sakthi K</span>
                          <ExternalLink className="w-3 h-3 text-stone-500 group-hover:text-[#FF6B1A] transition-colors" />
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <svg className="w-3 h-3 text-stone-400 shrink-0 fill-current" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                          <span>github.com/Sakthi10122004</span>
                        </div>
                        <div className="text-[10px] text-stone-400/90 flex items-center gap-1 mt-0.5">
                          <Mail className="w-2.5 h-2.5 text-[#FF6B1A] shrink-0" />
                          <span>sakthikaribeeran@gmail.com</span>
                        </div>
                      </div>
                    </div>
                  </a>

                  {/* Naveen Kumar J */}
                  <a
                    href="https://github.com/Naveenjmns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-[#D9A441]/50 hover:bg-stone-850 transition-all flex items-center justify-between gap-3 text-left shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:scale-105 transition-transform">
                        NK
                      </div>
                      <div>
                        <div className="text-white font-bold text-xs group-hover:text-[#D9A441] transition-colors flex items-center gap-1.5">
                          <span>Naveen Kumar J</span>
                          <ExternalLink className="w-3 h-3 text-stone-500 group-hover:text-[#D9A441] transition-colors" />
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <svg className="w-3 h-3 text-stone-400 shrink-0 fill-current" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                          </svg>
                          <span>github.com/Naveenjmns</span>
                        </div>
                        <div className="text-[10px] text-stone-400/90 flex items-center gap-1 mt-0.5">
                          <Mail className="w-2.5 h-2.5 text-[#D9A441] shrink-0" />
                          <span>naveenkumarjmns@gmail.com</span>
                        </div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              {/* App Repository */}
              <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-800 border border-stone-700/80 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span>App Repository</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                        Open Source
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                      https://github.com/Naveenjmns/SHC-SHINE
                    </div>
                  </div>
                </div>

                <a
                  href="https://github.com/Naveenjmns/SHC-SHINE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-target px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold border border-stone-700 hover:border-amber-400/50 hover:text-amber-300 transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
                >
                  <span>View Repository</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
              <span className="text-[11px] text-stone-500">
                Designed & Engineered for SHINE - Symposium Management App
              </span>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="tap-target px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF6B1A] hover:bg-[#E8551F] transition shadow-md shadow-orange-600/20 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
