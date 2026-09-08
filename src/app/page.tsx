import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StageHeaderBanner from "@/components/StageHeaderBanner";
import EventCard from "@/components/EventCard";
import CountdownTimer from "@/components/CountdownTimer";
import Footer from "@/components/Footer";
import PresentationController from "@/components/PresentationController";
import { getActiveEdition } from "@/lib/eventService";
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

export const revalidate = 5;

interface EventWithCoord {
  id: string;
  name: string;
  description: string | null;
  category: "ON_STAGE" | "OFF_STAGE";
  fee: number;
  capacity: number | null;
  venue: string | null;
  dateTime: Date;
  rules?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  staffCoordinatorName?: string | null;
  staffCoordinatorEmail?: string | null;
  staffCoordinatorPhone?: string | null;
  staffCoordinatorImageUrl?: string | null;
  studentCoordinatorName?: string | null;
  studentCoordinatorEmail?: string | null;
  studentCoordinatorPhone?: string | null;
  studentCoordinatorImageUrl?: string | null;
  staffCoordinator?: {
    id?: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
  studentCoordinator?: {
    id?: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
  coordinator?: {
    id?: string;
    name: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export default async function Home() {
  const activeEdition = await getActiveEdition();

  let events: EventWithCoord[] = [];
  try {
    const activeEditionCondition =
      activeEdition.id && activeEdition.id !== "default-shine"
        ? {
          OR: [
            { editionId: activeEdition.id },
            { editionId: null },
          ],
        }
        : {};

    events = await prisma.event.findMany({
      where: activeEditionCondition,
      include: {
        staffCoordinator: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
        studentCoordinator: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
        coordinator: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
        },
      },
      orderBy: { dateTime: "asc" },
    });
  } catch (e) {
    console.error("Failed to load events for landing page:", e);
  }

  const onStage = events.filter((e) => e.category === "ON_STAGE");
  const offStage = events.filter((e) => e.category === "OFF_STAGE");

  const eventName = activeEdition.name || "SHINE";
  const editionYear = activeEdition.edition || "2026";
  const startDate = activeEdition.startDate ? new Date(activeEdition.startDate).toISOString() : "2026-09-17T09:30:00+05:30";

  return (
    <main className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      {/* Official College Stage Header Banner (Revealed during Stage View) */}
      <StageHeaderBanner edition={activeEdition} />

      <Navbar edition={activeEdition} />

      {/* Hero Section with Stage 1-6 Reveal Sequence */}
      <HeroSection edition={activeEdition} />

      {/* Stage 16:9 Presentation View Controller */}
      <PresentationController sectionCount={5} />

      {/* About Fest & Institution Section */}
      <section id="about" className="py-24 border-b border-[#1C1917]/10 bg-white/70">
        <div className="container-shine">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-3">
              About The Symposium
            </span>
            <h2
              className="text-fluid-h1 font-extrabold text-[#1C1917] tracking-tight mb-4"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Excellence Meets Innovation
            </h2>
            <p className="text-fluid-body text-[#57534E]">
              {activeEdition.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch mb-12">
            {/* Dynamic Institution Card */}
            <div className="fest-card p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A] mb-5">
                  {activeEdition.institutionCrestUrl ? (
                    <img
                      src={activeEdition.institutionCrestUrl}
                      alt={activeEdition.institutionName || "Institution"}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Landmark className="w-6 h-6" />
                  )}
                </div>
                <h3
                  className="text-2xl font-bold text-[#1C1917] mb-3"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  {activeEdition.institutionName || "Host Institution"}
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed mb-6">
                  {activeEdition.institutionAbout || activeEdition.accreditationText || "Premier educational institution committed to academic excellence, innovation, and holistic student development."}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1C1917]/10 flex items-center justify-between text-xs text-[#57534E]">
                <span>{activeEdition.institutionLocation || activeEdition.venue || "Campus Venue"}</span>
                <span className="text-[#D9A441] font-semibold">{activeEdition.institutionShortName || "Host Institution"}</span>
              </div>
            </div>

            {/* Dynamic Host Department Card */}
            <div className="fest-card p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#D9A441]/10 border border-[#D9A441]/20 flex items-center justify-center text-[#D9A441] mb-5">
                  {activeEdition.deptLogoUrl ? (
                    <img
                      src={activeEdition.deptLogoUrl}
                      alt={activeEdition.hostDepartment || "Department"}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Laptop className="w-6 h-6" />
                  )}
                </div>
                <h3
                  className="text-2xl font-bold text-[#1C1917] mb-3"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  {activeEdition.hostDepartment || "Host Department"}
                </h3>
                <p className="text-sm text-[#57534E] leading-relaxed mb-6">
                  {activeEdition.departmentAbout || "Nurturing top-tier engineers, developers, and technical innovators through state-of-the-art labs, hands-on curricula, and competitions."}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1C1917]/10 flex items-center justify-between text-xs text-[#57534E]">
                <span>{activeEdition.departmentProgram || "Academic Department"}</span>
                <span className="text-[#FF6B1A] font-semibold">Host of {eventName} {editionYear}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { num: events.length > 0 ? `${events.length}+` : "0+", label: "Competitive Events", icon: <Zap className="w-5 h-5 text-[#FF6B1A] mx-auto" /> },
              { num: "₹25K+", label: "Cash Prize Pool", icon: <Trophy className="w-5 h-5 text-[#D9A441] mx-auto" /> },
              { num: "500+", label: "Expected Delegates", icon: <Users className="w-5 h-5 text-[#FF6B1A] mx-auto" /> },
              { num: "09:30 AM", label: "Sept 17, 2026", icon: <Calendar className="w-5 h-5 text-[#D9A441] mx-auto" /> },
            ].map((stat) => (
              <div key={stat.label} className="fest-card p-5 text-center">
                <div className="mb-2">{stat.icon}</div>
                <div
                  className="text-2xl sm:text-3xl font-black text-[#1C1917] tabular-nums"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  {stat.num}
                </div>
                <div className="text-xs text-[#57534E] mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedule Section — Always displays Live Countdown Timer + Dynamic Admin Schedule */}
      <section id="schedule" className="py-24 border-b border-[#1C1917]/10 bg-white/70">
        <div className="container-shine">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-3">
              Event Timeline
            </span>
            <h2
              className="text-fluid-h1 font-extrabold text-[#1C1917] tracking-tight mb-4"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Symposium Schedule
            </h2>
            <p className="text-fluid-body text-[#57534E]">
              Official Program Schedule for {eventName} {editionYear}
            </p>
          </div>

          {/* Dynamic Live Countdown Widget */}
          <CountdownTimer targetDate={startDate} />

          {/* Dynamic Schedule Items from CMS */}
          {activeEdition.scheduleItems && activeEdition.scheduleItems.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-4 mt-12">
              {activeEdition.scheduleItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="fest-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-[#FF6B1A]/40"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A] shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold font-mono text-[#FF6B1A] bg-[#FF6B1A]/10 px-2.5 py-0.5 rounded-md border border-[#FF6B1A]/20">
                          {item.time}
                        </span>
                        {item.tag && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-100 text-amber-900 border-amber-300">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-[#1C1917]" style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-[#57534E] mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.venue && (
                    <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[#D9A441] bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60 self-start md:self-auto">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{item.venue}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Events Showcase Section */}
      <section id="events" className="py-24 border-b border-[#1C1917]/10 bg-[#FAF8F5]">
        <div className="container-shine">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#D9A441]/10 text-[#92400E] border border-[#D9A441]/30 text-xs font-bold uppercase tracking-wider mb-3">
                Arena Lineup
              </span>
              <h2
                className="text-fluid-h1 font-extrabold text-[#1C1917] tracking-tight"
                style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
              >
                {events.length} Competitions. Choose Your Arena.
              </h2>
              <p className="text-fluid-body text-[#57534E] mt-2 max-w-xl">
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
            <div className="flex items-center gap-2.5 mb-6 text-sm font-bold text-[#FF6B1A] uppercase tracking-wider">
              <Theater className="w-5 h-5" />
              <span>On-Stage Events</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
              {onStage.map((ev, index) => (
                <EventCard
                  key={ev.id}
                  id={ev.id}
                  name={ev.name}
                  description={ev.description || ""}
                  category={ev.category}
                  capacity={ev.capacity}
                  venue={ev.venue || ""}
                  dateTime={ev.dateTime}
                  rules={ev.rules}
                  imageUrl={ev.imageUrl}
                  logoUrl={ev.logoUrl}
                  staffCoordinator={ev.staffCoordinator}
                  studentCoordinator={ev.studentCoordinator}
                  coordinator={ev.coordinator}
                  staffCoordinatorName={ev.staffCoordinatorName}
                  staffCoordinatorEmail={ev.staffCoordinatorEmail}
                  staffCoordinatorPhone={ev.staffCoordinatorPhone}
                  staffCoordinatorImageUrl={ev.staffCoordinatorImageUrl}
                  studentCoordinatorName={ev.studentCoordinatorName}
                  studentCoordinatorEmail={ev.studentCoordinatorEmail}
                  studentCoordinatorPhone={ev.studentCoordinatorPhone}
                  studentCoordinatorImageUrl={ev.studentCoordinatorImageUrl}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Off-Stage Arenas */}
          <div>
            <div className="flex items-center gap-2.5 mb-6 text-sm font-bold text-[#D9A441] uppercase tracking-wider">
              <Laptop className="w-5 h-5" />
              <span>Off-Stage Events</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 sm:gap-6">
              {offStage.map((ev, index) => (
                <EventCard
                  key={ev.id}
                  id={ev.id}
                  name={ev.name}
                  description={ev.description || ""}
                  category={ev.category}
                  capacity={ev.capacity}
                  venue={ev.venue || ""}
                  dateTime={ev.dateTime}
                  rules={ev.rules}
                  imageUrl={ev.imageUrl}
                  logoUrl={ev.logoUrl}
                  staffCoordinator={ev.staffCoordinator}
                  studentCoordinator={ev.studentCoordinator}
                  coordinator={ev.coordinator}
                  staffCoordinatorName={ev.staffCoordinatorName}
                  staffCoordinatorEmail={ev.staffCoordinatorEmail}
                  staffCoordinatorPhone={ev.staffCoordinatorPhone}
                  staffCoordinatorImageUrl={ev.staffCoordinatorImageUrl}
                  studentCoordinatorName={ev.studentCoordinatorName}
                  studentCoordinatorEmail={ev.studentCoordinatorEmail}
                  studentCoordinatorPhone={ev.studentCoordinatorPhone}
                  studentCoordinatorImageUrl={ev.studentCoordinatorImageUrl}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rules & Guidelines Section */}
      <section id="rules" className="py-24 border-b border-[#1C1917]/10 bg-white/70">
        <div className="container-shine">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#FF6B1A]/10 text-[#FF6B1A] border border-[#FF6B1A]/20 text-xs font-bold uppercase tracking-wider mb-3">
              Guidelines
            </span>
            <h2
              className="text-fluid-h1 font-extrabold text-[#1C1917] tracking-tight mb-4"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              Symposium Rules & Guidelines
            </h2>
            <p className="text-fluid-body text-[#57534E]">
              Essential information for participants, faculty coordinators, and college delegations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="fest-card p-6">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A] mb-4">
                <Ticket className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] mb-2">Eligibility & Registration</h3>
              <p className="text-sm text-[#57534E] leading-relaxed">
                Open to all bona fide UG and PG students of Computer Science, Applications, IT, and related engineering disciplines with valid college ID cards.
              </p>
            </div>

            <div className="fest-card p-6">
              <div className="w-10 h-10 rounded-xl bg-[#D9A441]/10 border border-[#D9A441]/20 flex items-center justify-center text-[#D9A441] mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] mb-2">Reporting & Timings</h3>
              <p className="text-sm text-[#57534E] leading-relaxed">
                Participants must report at the registration desk by 09:00 AM sharp on Sep 17, 2026. Spot registrations close at 10:30 AM.
              </p>
            </div>

            <div className="fest-card p-6">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A] mb-4">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1917] mb-2">Overall Championship</h3>
              <p className="text-sm text-[#57534E] leading-relaxed">
                The institution securing maximum cumulative points across both On-Stage and Off-Stage events will be crowned the {eventName} Overall Champions.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer edition={activeEdition} />
    </main>
  );
}
