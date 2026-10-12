import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LandingHero from "@/components/home/LandingHero";
import FestStatsStrip from "@/components/home/FestStatsStrip";
import FestArenasGrid from "@/components/home/FestArenasGrid";
import ScheduleOverview from "@/components/home/ScheduleOverview";
import SponsorsStrip from "@/components/home/SponsorsStrip";
import { getActiveEdition } from "@/lib/eventService";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const activeEdition = await getActiveEdition();

  let events: any[] = [];
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

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col selection:bg-accent-muted selection:text-accent">
      <Navbar edition={activeEdition} />

      <main className="flex-1">
        {/* 1. Hero Section with dynamic countdown, solid wordmark & key CTAs */}
        <LandingHero edition={activeEdition} />

        {/* 2. Key Stats Strip (Colleges, Events, Prize Pool, Delegates) */}
        <FestStatsStrip
          prizePool={activeEdition.prizePool || "₹25K+"}
          expectedDelegates={activeEdition.expectedDelegates || "500+"}
          eventsCount={events.length || 14}
        />

        {/* 3. Fest Arenas (On-Stage vs Off-Stage Showcases) */}
        <FestArenasGrid events={events} />

        {/* 4. Schedule Timeline Overview */}
        <ScheduleOverview />

        {/* 5. Institutional Partnerships, Rules & Inquiries */}
        <SponsorsStrip edition={activeEdition} />
      </main>

      <Footer />
    </div>
  );
}
