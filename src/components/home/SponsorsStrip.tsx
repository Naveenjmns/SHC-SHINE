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
    <section className="container-shine py-20 lg:py-24">
      <div className="rounded-3xl bg-surface-inverse text-white px-6 py-12 sm:px-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#a6bbd1]">
            <ShieldCheck className="w-4 h-4" /> Official registration desk
          </p>
          <h2 className="mt-3 text-3xl sm:text-[2.75rem] leading-[1.2] font-bold text-white">
            Ready to represent your institution?
          </h2>
          <p className="mt-4 text-lg text-[#c9d7e6] leading-relaxed max-w-xl">
            Open to all UG & PG students of Computer Applications, Science, and IT. Register your
            team in under three minutes and get digital badges instantly.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Start registration
              </Button>
            </Link>
          </div>
        </div>

        <ul className="space-y-4 text-base text-[#c9d7e6] lg:border-l lg:border-white/15 lg:pl-10">
          <li className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-white shrink-0" />
            <a href={`mailto:${email}`} className="hover:text-white transition-colors font-medium break-all">
              {email}
            </a>
          </li>
          <li className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-white shrink-0" />
            <a href={`tel:${phone}`} className="hover:text-white transition-colors font-medium">
              {phone}
            </a>
          </li>
          <li className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-white shrink-0" />
            <span>{location}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
