import Link from "next/link";
import ParticleField from "@/components/ParticleField";
import { Sparkles, Trophy, ArrowRight, Home, Compass, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0C0A09] text-stone-100 px-4 py-16">
      {/* Background Animated Rising Embers */}
      <ParticleField particleCount={45} />

      {/* Radiant Sunburst Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[500px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF6B1A]/20 via-[#D9A441]/10 to-transparent blur-3xl opacity-80" />
      </div>

      <div className="relative z-10 max-w-xl w-full text-center space-y-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold uppercase tracking-widest text-[#D9A441]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Sector Not Found</span>
        </div>

        {/* Big 404 Heading */}
        <div className="relative">
          <h1
            className="text-8xl sm:text-9xl md:text-[140px] font-black tracking-tighter leading-none select-none bg-gradient-to-b from-white via-stone-200 to-stone-500 bg-clip-text text-transparent drop-shadow-[0_15px_35px_rgba(255,107,26,0.25)]"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            4<span className="hero-wordmark-gradient">0</span>4
          </h1>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs uppercase font-extrabold tracking-[0.35em] text-[#FF6B1A] whitespace-nowrap">
            Arena Coordinate Missing
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2 pt-4">
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
          >
            Lost in the Fest Orbit?
          </h2>
          <p className="text-sm sm:text-base text-stone-400 max-w-md mx-auto leading-relaxed">
            The competition track, delegate portal, or resource you are looking for does not exist, has been concluded, or was relocated.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#FF6B1A] to-[#E8551F] text-white hover:brightness-110 transition shadow-lg shadow-orange-500/25"
          >
            <Home className="w-4 h-4" />
            <span>Return to Main Stage</span>
          </Link>

          <Link
            href="/events"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold bg-stone-900/90 border border-stone-800 text-stone-200 hover:bg-stone-800 hover:text-white transition"
          >
            <Compass className="w-4 h-4 text-[#D9A441]" />
            <span>Browse All Events</span>
          </Link>
        </div>

        {/* Quick Links Footer Strip */}
        <div className="pt-8 border-t border-stone-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
          <Link href="/leaderboard" className="hover:text-[#D9A441] transition flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[#D9A441]" />
            <span>Live Stage Results</span>
          </Link>
          <span>•</span>
          <Link href="/register" className="hover:text-[#FF6B1A] transition flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FF6B1A]" />
            <span>Delegate Registration</span>
          </Link>
          <span>•</span>
          <Link href="/login" className="hover:text-stone-300 transition">
            Portal Login →
          </Link>
        </div>
      </div>
    </div>
  );
}
