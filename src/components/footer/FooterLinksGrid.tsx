"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Theater, Laptop, Info } from "lucide-react";

interface FooterLinksGridProps {
  eventName: string;
  institutionName: string;
  location: string;
  contactEmail: string;
  contactPhone: string;
  websiteUrl?: string | null;
  onOpenAboutModal: () => void;
}

export default function FooterLinksGrid({
  eventName,
  institutionName,
  location,
  contactEmail,
  contactPhone,
  websiteUrl,
  onOpenAboutModal,
}: FooterLinksGridProps) {
  return (
    <>
      {/* Col 2: Navigation Links */}
      <div>
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Quick Links
        </h4>
        <ul className="space-y-2 text-xs">
          <li>
            <Link href="/#about" className="text-stone-400 hover:text-white transition-colors">
              About {eventName}
            </Link>
          </li>
          <li>
            <Link href="/events" className="text-stone-400 hover:text-white transition-colors">
              All Competitions
            </Link>
          </li>
          <li>
            <Link href="/#schedule" className="text-stone-400 hover:text-white transition-colors">
              Schedule & Timeline
            </Link>
          </li>
          <li>
            <Link
              href="/leaderboard"
              className="text-[#D9A441] hover:text-amber-300 font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Live Stage Results</span>
            </Link>
          </li>
          <li>
            <Link
              href="/register"
              className="text-[#FF6B1A] hover:text-orange-400 font-semibold transition-colors"
            >
              Online Registration
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={onOpenAboutModal}
              className="text-stone-400 hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer pt-0.5"
            >
              <Info className="w-3.5 h-3.5 text-[#FF6B1A]" />
              <span>About the App</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Col 3: Fest Arenas */}
      <div>
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Fest Arenas
        </h4>
        <ul className="space-y-2 text-xs">
          <li>
            <Link
              href="/events?category=ON_STAGE"
              className="text-stone-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <Theater className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
              <span>On-Stage Competitions</span>
            </Link>
          </li>
          <li>
            <Link
              href="/events?category=OFF_STAGE"
              className="text-stone-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <Laptop className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
              <span>Off-Stage Technical Arenas</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Col 4: Reach Us */}
      <div>
        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
          Reach Us
        </h4>
        <div className="space-y-1.5 text-xs text-stone-400 leading-relaxed">
          <div className="text-white font-semibold">{institutionName}</div>
          <div className="text-[11px]">{location}</div>
          <div className="pt-1">
            Email:{" "}
            <a href={`mailto:${contactEmail}`} className="text-stone-300 hover:text-white font-medium">
              {contactEmail}
            </a>
          </div>
          <div>
            Phone:{" "}
            <a href={`tel:${contactPhone}`} className="text-stone-300 hover:text-white font-medium">
              {contactPhone}
            </a>
          </div>
          {websiteUrl && (
            <div>
              Web:{" "}
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                {websiteUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

