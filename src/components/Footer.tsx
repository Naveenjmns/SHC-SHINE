import Link from "next/link";
import { Trophy, Theater, Laptop } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#1C1917] bg-[#1C1917] text-stone-300 text-xs">
      <div className="container-shine py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1: Logo & Mission */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B1A] to-[#D9A441] flex items-center justify-center text-white font-black text-base shadow-sm"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                S
              </div>
              <span
                className="text-lg font-extrabold text-white"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                SHINE <span className="hero-wordmark-gradient">26</span>
              </span>
            </Link>
            <p className="leading-relaxed mb-4 text-stone-400">
              Annual Intercollegiate Technical & Management Symposium hosted by the Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur.
            </p>
            <div className="text-[#D9A441] font-bold">
              Thursday, October 15, 2026
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Quick Links
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/#about" className="hover:text-white transition-colors">About SHINE 26</Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">All 10 Competitions</Link>
              </li>
              <li>
                <Link href="/#venue" className="hover:text-white transition-colors">Venue & Schedule</Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-[#D9A441] hover:text-amber-300 font-semibold transition-colors inline-flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#D9A441]" /> Live Stage Results
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-[#FF6B1A] hover:text-orange-400 font-bold transition-colors">
                  Online Registration
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Arenas */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Fest Arenas
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/events?category=ON_STAGE" className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                  <Theater className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                  <span>On-Stage: Code & Conquer, Tech Quiz, Debate, Paper Presentation</span>
                </Link>
              </li>
              <li>
                <Link href="/events?category=OFF_STAGE" className="hover:text-white transition-colors inline-flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                  <span>Off-Stage: Web Design, Poster Design, Treasure Hunt, Gaming Zone, Photography, IT Manager</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Venue */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Reach Us
            </h4>
            <div className="space-y-2 leading-relaxed text-stone-400">
              <div className="text-white font-bold">Sacred Heart College (Autonomous)</div>
              <div>Tirupattur — 635 601, Tamil Nadu, India</div>
              <div>Email: <a href="mailto:shine@shctpt.edu" className="text-[#D9A441] hover:underline font-semibold">shine@shctpt.edu</a></div>
              <div>Phone: <a href="tel:+914175240464" className="text-[#D9A441] hover:underline font-semibold">+91 4175 240464</a></div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-400">
          <div>
            © 2026 Department of Computer Applications (PG), Sacred Heart College. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Staff & Student Login</Link>
            <span>•</span>
            <span className="text-stone-500">Built for SHINE 26</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
