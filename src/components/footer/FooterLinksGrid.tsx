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
        <h4 className="text-sm font-semibold text-ink-muted uppercase tracking-[0.08em] mb-4">
          Quick Links
        </h4>
        <ul className="space-y-3 text-[15px]">
          <li>
            <Link href="/#about" className="text-ink font-medium hover:text-accent transition-colors">
              About {eventName}
            </Link>
          </li>
          <li>
            <Link href="/events" className="text-ink font-medium hover:text-accent transition-colors">
              All Competitions
            </Link>
          </li>
          <li>
            <Link href="/#schedule" className="text-ink font-medium hover:text-accent transition-colors">
              Schedule & Timeline
            </Link>
          </li>
          <li>
            <Link
              href="/leaderboard"
              className="text-ink font-medium hover:text-accent transition-colors inline-flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-gold" />
              <span>Live Stage Results</span>
            </Link>
          </li>
          <li>
            <Link
              href="/register"
              className="text-accent font-semibold hover:text-accent-hover transition-colors"
            >
              Online Registration
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={onOpenAboutModal}
              className="text-ink font-medium hover:text-accent transition-colors inline-flex items-center gap-1.5 cursor-pointer pt-0.5"
            >
              <Info className="w-3.5 h-3.5" />
              <span>About the App</span>
            </button>
          </li>
        </ul>
      </div>

      {/* Col 3: Fest Arenas */}
      <div>
        <h4 className="text-sm font-semibold text-ink-muted uppercase tracking-[0.08em] mb-4">
          Fest Arenas
        </h4>
        <ul className="space-y-3 text-[15px]">
          <li>
            <Link
              href="/events?category=ON_STAGE"
              className="text-ink font-medium hover:text-accent transition-colors inline-flex items-center gap-1.5"
            >
              <Theater className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span>On-Stage Competitions</span>
            </Link>
          </li>
          <li>
            <Link
              href="/events?category=OFF_STAGE"
              className="text-ink font-medium hover:text-accent transition-colors inline-flex items-center gap-1.5"
            >
              <Laptop className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span>Off-Stage Technical Arenas</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Col 4: Reach Us */}
      <div>
        <h4 className="text-sm font-semibold text-ink-muted uppercase tracking-[0.08em] mb-4">
          Reach Us
        </h4>
        <div className="space-y-2 text-[15px] text-ink-muted leading-relaxed">
          <div className="text-ink font-semibold">{institutionName}</div>
          <div>{location}</div>
          <div className="pt-1">
            Email:{" "}
            <a href={`mailto:${contactEmail}`} className="text-ink hover:text-accent font-medium">
              {contactEmail}
            </a>
          </div>
          <div>
            Phone:{" "}
            <a href={`tel:${contactPhone}`} className="text-ink hover:text-accent font-medium">
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
                className="text-accent hover:underline"
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

