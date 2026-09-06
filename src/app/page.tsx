import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import Footer from "@/components/Footer";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Landmark,
  Laptop,
  Zap,
  Trophy,
  Users,
  Calendar,
  Theater,
  MapPin,
  Clock,
  Ticket,
  ExternalLink,
} from "lucide-react";

import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type EventWithCoord = Prisma.EventGetPayload<{
  include: {
    coordinator: {
      select: { name: true; email: true };
    };
  };
}>;

export default async function Home() {
  let events: EventWithCoord[] = [];
  try {
    events = await prisma.event.findMany({
      include: {
        coordinator: {
          select: { name: true, email: true },
        },
      },
      orderBy: { dateTime: "asc" },
    });
  } catch (e) {
    console.error("Failed to load events for landing page:", e);
  }

  const onStage = events.filter((e) => e.category === "ON_STAGE");
  const offStage = events.filter((e) => e.category === "OFF_STAGE");

  return (
    <main className="min-h-screen flex flex-col bg-[#0B0A0A] text-[#F3F4F6]">
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* About Fest & Institution Section */}
      <section id="about" className="py-24 border-b border-white/10 bg-[#0E0D0D]">
        <div className="container-shine">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-3">
              About The Fest
            </span>
            <h2
              className="text-fluid-h1 font-extrabold text-white tracking-tight mb-4"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Excellence Meets Innovation
            </h2>
            <p className="text-fluid-body text-[#9CA3AF]">
              SHINE 26 is the annual intercollegiate flagship symposium organized by the Department of Computer Applications (PG), Sacred Heart College (Autonomous), Tirupattur.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-12">
            {/* Sacred Heart College Card */}
            <div className="fest-card p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#252222] border border-white/10 flex items-center justify-center text-[#FF6B1A] mb-5">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3
                  className="text-2xl font-bold text-white mb-3"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  Sacred Heart College (Autonomous)
                </h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed mb-6">
                  Established in 1951 by the Salesians of Don Bosco, Sacred Heart College is a premier institution recognized with NAAC 'A+' Grade accreditation and affiliated with Thiruvalluvar University. With a rich history of academic distinction, the college provides world-class infrastructure, research excellence, and a vibrant community.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>Tirupattur — 635 601, Tamil Nadu</span>
                <span className="text-[#D9A441] font-semibold">Autonomous Status</span>
              </div>
            </div>

            {/* MCA PG Department Card */}
            <div className="fest-card p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#252222] border border-white/10 flex items-center justify-center text-[#D9A441] mb-5">
                  <Laptop className="w-6 h-6" />
                </div>
                <h3
                  className="text-2xl font-bold text-white mb-3"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  Department of Computer Applications (PG)
                </h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed mb-6">
                  The Master of Computer Applications (MCA) department has been nurturing top-tier software engineers, data scientists, and technical leaders for decades. Through state-of-the-art labs, hands-on industry curricula, and hackathons, our graduates make impact across global tech giants.
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#9CA3AF]">
                <span>MCA Program</span>
                <span className="text-[#FF6B1A] font-semibold">Host of SHINE 26</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: "10+", label: "Competitive Events", icon: <Zap className="w-5 h-5 text-[#FF6B1A] mx-auto" /> },
              { num: "₹25K+", label: "Cash Prize Pool", icon: <Trophy className="w-5 h-5 text-[#D9A441] mx-auto" /> },
              { num: "500+", label: "Expected Delegates", icon: <Users className="w-5 h-5 text-[#FF6B1A] mx-auto" /> },
              { num: "1 Day", label: "Oct 15, 2026", icon: <Calendar className="w-5 h-5 text-[#D9A441] mx-auto" /> },
            ].map((stat) => (
              <div key={stat.label} className="fest-card p-5 text-center">
                <div className="mb-2">{stat.icon}</div>
                <div
                  className="text-2xl sm:text-3xl font-black text-white tabular-nums"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  {stat.num}
                </div>
                <div className="text-xs text-[#9CA3AF] mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Events Showcase Section */}
      <section id="events" className="py-24 border-b border-white/10 bg-[#0B0A0A]">
        <div className="container-shine">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#D9A441]/10 text-[#F2C94C] border border-[#D9A441]/25 text-xs font-bold uppercase tracking-wider mb-3">
                Arena Lineup
              </span>
              <h2
                className="text-fluid-h1 font-extrabold text-white tracking-tight"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                10 Competitions. Choose Your Arena.
              </h2>
              <p className="text-fluid-body text-[#9CA3AF] mt-2 max-w-xl">
                Compete against colleges across South India. Individual and team contests in software, logic, creative arts, and managerial acumen.
              </p>
            </div>

            <Link
              href="/events"
              className="btn-gold-outline self-start md:self-auto shrink-0"
            >
              Browse Full Directory →
            </Link>
          </div>

          {/* On-Stage Arenas */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2.5 h-6 rounded-full bg-[#FF6B1A]" />
              <h3
                className="text-2xl font-bold text-white flex items-center gap-2.5"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                <Theater className="w-6 h-6 text-[#FF6B1A]" /> On-Stage Events
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {onStage.map((ev, idx) => (
                <EventCard
                  key={ev.id}
                  id={ev.id}
                  name={ev.name}
                  description={ev.description || ""}
                  category={ev.category}
                  fee={ev.fee}
                  venue={ev.venue || "Main Auditorium"}
                  index={idx}
                />
              ))}
            </div>
          </div>

          {/* Off-Stage Arenas */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2.5 h-6 rounded-full bg-[#D9A441]" />
              <h3
                className="text-2xl font-bold text-white flex items-center gap-2.5"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                <Laptop className="w-6 h-6 text-[#D9A441]" /> Off-Stage Events
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offStage.map((ev, idx) => (
                <EventCard
                  key={ev.id}
                  id={ev.id}
                  name={ev.name}
                  description={ev.description || ""}
                  category={ev.category}
                  fee={ev.fee}
                  venue={ev.venue || "Computer Lab"}
                  index={idx}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Venue & Schedule Section */}
      <section id="venue" className="py-24 border-b border-white/10 bg-[#0E0D0D]">
        <div className="container-shine">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-3">
              Location & Schedule
            </span>
            <h2
              className="text-fluid-h1 font-extrabold text-white tracking-tight mb-3"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Plan Your Visit
            </h2>
            <p className="text-fluid-body text-[#9CA3AF]">
              Sacred Heart College is located in Tirupattur, easily accessible by train and bus routes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Venue Card */}
            <div className="fest-card p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-[#252222] border border-white/10 flex items-center justify-center text-[#FF6B1A] mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                Campus Venue
              </h3>
              <p className="text-sm text-white font-medium mb-1">
                Sacred Heart College (Autonomous)
              </p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed mb-6">
                Tirupattur — 635 601, Tirupattur District, Tamil Nadu. Main events hosted in the Main Auditorium and Computer Labs.
              </p>
              <a
                href="https://maps.google.com/?q=Sacred+Heart+College+Tirupattur"
                target="_blank"
                rel="noreferrer"
                className="tap-target text-xs font-bold text-[#FF6B1A] hover:underline inline-flex items-center gap-1.5"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Schedule Card */}
            <div className="fest-card p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-[#252222] border border-white/10 flex items-center justify-center text-[#D9A441] mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                Date & Timing
              </h3>
              <div className="text-lg font-bold text-white mb-1">October 15, 2026</div>
              <p className="text-xs text-[#9CA3AF] mb-4">Thursday • 9:00 AM to 5:00 PM IST</p>
              <ul className="space-y-2 text-xs text-[#9CA3AF]">
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>08:30 AM</span>
                  <span className="text-white font-medium">Registration & Kit Desk</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>09:30 AM</span>
                  <span className="text-white font-medium">Inauguration Ceremony</span>
                </li>
                <li className="flex justify-between border-b border-white/5 pb-1.5">
                  <span>10:30 AM</span>
                  <span className="text-white font-medium">Competitions Commence</span>
                </li>
                <li className="flex justify-between">
                  <span>04:00 PM</span>
                  <span className="text-[#D9A441] font-bold">Valedictory & Awards</span>
                </li>
              </ul>
            </div>

            {/* Registration Summary Card */}
            <div className="fest-card p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#252222] border border-white/10 flex items-center justify-center text-[#FF6B1A] mb-4">
                  <Ticket className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                  Eligibility & Fees
                </h3>
                <p className="text-xs text-[#9CA3AF] leading-relaxed mb-4">
                  Open to all undergraduate and postgraduate students (MCA, MSc, BCA, BSc CS, B.Tech, and related departments).
                </p>
                <div className="bg-[#252222] p-3 rounded-xl border border-white/5 mb-4 text-xs">
                  <div className="flex justify-between text-white mb-1">
                    <span>Per Event Fee:</span>
                    <span className="font-bold text-[#D9A441]">₹50 — ₹150</span>
                  </div>
                  <div className="text-[11px] text-[#9CA3AF]">
                    Includes registration kit & certificates.
                  </div>
                </div>
              </div>

              <Link
                href="/register"
                className="btn-ember w-full text-center text-xs font-bold"
              >
                Register Online Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stage Live Results Callout */}
      <section className="py-16 bg-[#141212] border-b border-white/10">
        <div className="container-shine flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-[#D9A441] uppercase tracking-wider block mb-1">
              On-Stage Projector Mode
            </span>
            <h3 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
              Live Competition Leaderboard & Results
            </h3>
            <p className="text-sm text-[#9CA3AF] mt-1">
              High-contrast big-screen presentation display optimized for auditoriums and stage projectors.
            </p>
          </div>

          <Link
            href="/leaderboard"
            className="btn-ember text-sm px-6 py-3 shrink-0 font-bold flex items-center gap-1.5"
          >
            <span>Launch Stage Display</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </main>
  );
}
