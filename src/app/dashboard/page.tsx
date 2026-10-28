"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NextEventCard, { DashboardEvent } from "./components/NextEventCard";
import StudentPassCard from "./components/StudentPassCard";
import FoodTokenCard from "./components/FoodTokenCard";
import RegisteredEventsList from "./components/RegisteredEventsList";
import AppHero, { HeroStat, heroGhostButtonClass } from "@/components/layout/AppHero";
import QuickActions from "@/components/layout/QuickActions";
import { LogOut, Building2, MapPin, QrCode, UtensilsCrossed, Trophy } from "lucide-react";
import { formatTimeSafe } from "@/lib/dateUtils";
import { safeJson } from "@/lib/safeFetch";

export default function StudentDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [pass, setPass] = useState<any | null>(null);
  const [delegation, setDelegation] = useState<any | null>(null);
  const [editionInfo, setEditionInfo] = useState<any | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/dashboard");
      return;
    }

    if (status === "authenticated") {
      async function loadStudentData() {
        try {
          const res = await fetch("/api/student/registrations");
          const data = await safeJson(res, {
            success: false,
            registrations: [],
            pass: null,
            delegation: null,
            edition: null,
          });

          if (data.success) {
            setRegistrations(data.registrations || []);
            setPass(data.pass || null);
            setDelegation(data.delegation || null);
            setEditionInfo(data.edition || null);
          }
        } catch (err) {
          console.error("Failed to load student dashboard:", err);
        } finally {
          setLoading(false);
        }
      }
      loadStudentData();
    }
  }, [status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // Find the earliest upcoming registered event
  const upcomingEvents = registrations
    .map((r) => r.event)
    .filter(Boolean)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const nextEvent: DashboardEvent | null = upcomingEvents[0] || null;
  const fullName = session?.user?.name || pass?.name || "Delegate";
  const firstName = fullName.split(" ")[0];
  const collegeName = delegation?.collegeName || session?.user?.college || "Sacred Heart College";

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6 sm:space-y-8">
        <AppHero
          eyebrow="Student portal · SHINE 2026"
          title={<>Welcome, {firstName}</>}
          subtitle={
            <span className="inline-flex items-center gap-2">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">{collegeName}</span>
            </span>
          }
          actions={
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className={heroGhostButtonClass}
            >
              <LogOut />
              Sign out
            </button>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <HeroStat label="My events" value={registrations.length} />
            <HeroStat
              label="Pass status"
              value={pass ? "Active" : "Pending"}
              hint={pass ? "Ready for check-in" : "Awaiting verification"}
            />
            <div className="col-span-2 sm:col-span-1">
              <HeroStat
                label="Up next"
                value={<span className="text-lg sm:text-xl truncate block">{nextEvent?.name || "—"}</span>}
                hint={nextEvent ? formatTimeSafe(nextEvent.dateTime) : "No events yet"}
              />
            </div>
          </div>
        </AppHero>

        <QuickActions
          actions={[
            { label: "My pass", description: "Entry QR code", icon: <QrCode />, href: "#pass" },
            { label: "Lunch token", description: "Dining hall", icon: <UtensilsCrossed />, href: "#food" },
            { label: "Campus map", description: "Find venues", icon: <MapPin />, href: "/loc/wp-entrance" },
            { label: "Live results", description: "Leaderboard", icon: <Trophy />, href: "/leaderboard" },
          ]}
        />

        {/* 1. UP NEXT: Primary Hero Card */}
        <NextEventCard event={nextEvent} festDate={editionInfo?.startDate} />

        {/* 2. Dual Passes Grid (Event QR Pass + Food Token) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div id="pass" className="scroll-mt-24">
          <StudentPassCard
            pass={pass}
            collegeName={delegation?.collegeName || session?.user?.college}
          />
          </div>
          <div id="food" className="scroll-mt-24">
          <FoodTokenCard
            foodPass={pass}
            diningVenue={editionInfo?.diningHallVenue}
          />
          </div>
        </div>

        {/* 3. Registered Arenas Listing */}
        <RegisteredEventsList registrations={registrations} />
      </main>

      <Footer />
    </div>
  );
}
