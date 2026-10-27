"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOutAndClearCache } from "@/lib/signOutAndClearCache";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import NextEventCard, { DashboardEvent } from "./components/NextEventCard";
import StudentPassCard from "./components/StudentPassCard";
import FoodTokenCard from "./components/FoodTokenCard";
import RegisteredEventsList from "./components/RegisteredEventsList";
import { Button, Badge } from "@/components/ui";
import { LogOut, User, Building2, MapPin } from "lucide-react";
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
      <div className="min-h-screen bg-surface flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-surface text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-28 pb-16 space-y-8">
        {/* Student Portal Header */}
        <div className="p-5 rounded-[12px] bg-surface-raised border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="accent">STUDENT PORTAL</Badge>
              <span className="text-xs text-ink-muted">SHINE 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display text-ink">
              Welcome, {session?.user?.name || pass?.name || "Delegate"}
            </h1>
            <p className="text-xs text-ink-muted flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-ink-subtle" />
              <span>{delegation?.collegeName || session?.user?.college || "Sacred Heart College"}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Link href="/loc/wp-entrance">
              <Button variant="outline" size="sm" leftIcon={<MapPin className="w-3.5 h-3.5" />}>
                Campus Map
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOutAndClearCache({ callbackUrl: "/" })}
              leftIcon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* 1. UP NEXT: Primary Hero Card */}
        <NextEventCard event={nextEvent} festDate={editionInfo?.startDate} />

        {/* 2. Dual Passes Grid (Event QR Pass + Food Token) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StudentPassCard
            pass={pass}
            collegeName={delegation?.collegeName || session?.user?.college}
          />
          <FoodTokenCard
            foodPass={pass}
            diningVenue={editionInfo?.diningHallVenue}
          />
        </div>

        {/* 3. Registered Arenas Listing */}
        <RegisteredEventsList registrations={registrations} />
      </main>

      <Footer />
    </div>
  );
}
