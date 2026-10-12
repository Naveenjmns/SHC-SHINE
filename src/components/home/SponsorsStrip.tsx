import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck } from "lucide-react";
import { ActiveEditionConfig } from "@/lib/eventService";

interface SponsorsStripProps {
  edition?: ActiveEditionConfig;
}

export default function SponsorsStrip({ edition }: SponsorsStripProps) {
  const email = edition?.contactEmail || "shine@shctpt.edu";
  const phone = edition?.contactPhone || "+91 4175 240464";
  const location = edition?.institutionLocation || "Tirupattur — 635 601, Tamil Nadu";

  return (
    <section className="bg-surface-raised border-y border-border py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              <ShieldCheck className="w-4 h-4" /> Official Inquiries & Registration Desk
            </div>
            <h2 className="text-2xl font-bold font-display text-ink tracking-tight">
              Ready to Represent Your Institution?
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed max-w-lg">
              Registration is open to all UG & PG students of Computer Applications, Science, and IT.
              Spot registration is subject to seating availability in respective arena laboratories.
            </p>

            <div className="space-y-2 pt-2 text-xs text-ink-muted">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-accent transition-colors font-medium">
                  {email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-accent transition-colors font-medium">
                  {phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent shrink-0" />
                <span>{location}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-[12px] bg-surface border border-border space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-ink">Register Your Delegation</h3>
              <p className="text-xs text-ink-muted">
                Complete team registration in under 3 minutes with digital badge generation.
              </p>
            </div>
            <Link href="/register" className="shrink-0 w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                fullWidth
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Registration
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
