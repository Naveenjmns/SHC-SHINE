"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Printer, QrCode, Filter } from "lucide-react";
import QRCode from "qrcode";
import type { WaypointNode } from "@/lib/wayfinding";

interface PrintableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  waypoints: WaypointNode[];
  editionName?: string;
  institutionName?: string;
}

interface QrItem {
  id: string;
  label: string;
  floor: number;
  zoneId?: string;
  url: string;
  qrDataUrl: string;
}

export default function PrintableQrModal({
  isOpen,
  onClose,
  waypoints,
  editionName = "SHINE 2026",
  institutionName = "Sacred Heart College (Autonomous), Tirupattur",
}: PrintableQrModalProps) {
  const [qrItems, setQrItems] = useState<QrItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "HALLS" | "AMENITIES">("ALL");
  const generating = waypoints.length > 0 && qrItems.length === 0;

  // Generate QR codes for all waypoints
  useEffect(() => {
    if (!isOpen || waypoints.length === 0) return;

    let isMounted = true;

    async function buildQrs() {
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://shine.shctpt.edu";

      const items: QrItem[] = [];

      for (const wp of waypoints) {
        const targetUrl = `${origin}/loc/${wp.id}`;
        try {
          const qrDataUrl = await QRCode.toDataURL(targetUrl, {
            errorCorrectionLevel: "H",
            margin: 2,
            scale: 8,
            color: {
              dark: "#0B3558",
              light: "#FFFFFF",
            },
          });

          items.push({
            id: wp.id,
            label: wp.label || wp.id.replace(/^wp-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            floor: wp.floor || 1,
            zoneId: wp.zoneId,
            url: targetUrl,
            qrDataUrl,
          });
        } catch (err) {
          console.error(`Failed to generate QR for ${wp.id}:`, err);
        }
      }

      if (isMounted) {
        setQrItems(items);
      }
    }

    buildQrs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, waypoints]);

  const filteredItems = useMemo(() => {
    if (filter === "HALLS") {
      return qrItems.filter((item) => item.id.includes("hall") || item.id.includes("room") || item.zoneId);
    }
    if (filter === "AMENITIES") {
      return qrItems.filter(
        (item) =>
          item.id.includes("amenity") ||
          item.id.includes("entrance") ||
          item.id.includes("food") ||
          item.id.includes("restroom") ||
          item.id.includes("water")
      );
    }
    return qrItems;
  }, [qrItems, filter]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0b3558]/50 backdrop-blur-xs animate-in fade-in"
    >
      {/* Print stylesheet to isolate QR cards on paper */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-container, #printable-qr-container * {
            visibility: visible;
          }
          #printable-qr-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: #0B3558 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .qr-print-card {
            page-break-inside: avoid;
            break-inside: avoid;
            border: 2px solid #0B3558 !important;
            box-shadow: none !important;
            margin-bottom: 24px !important;
            background: white !important;
            color: #0B3558 !important;
          }
        }
      `}} />

      <div className="bg-surface border border-border rounded-3xl shadow-modal flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] overflow-hidden text-ink">
        {/* Header Bar */}
        <header className="no-print px-6 py-4 border-b border-border bg-surface flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-muted flex items-center justify-center text-accent shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">
                Printable Venue QR Checkpoints
              </h2>
              <p className="text-sm text-ink-muted">
                Generate high-resolution printable signage for doors, halls, and junctions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={generating || qrItems.length === 0}
              className="min-h-[44px] px-4 py-2 rounded-[8px] bg-accent hover:bg-accent-hover text-accent-ink text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Checkpoints</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-[8px] text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Filter controls */}
        <div className="no-print px-6 py-3 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>

            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === "ALL"
                  ? "bg-accent text-accent-ink"
                  : "bg-surface-raised text-ink-muted hover:text-ink"
              }`}
            >
              All ({qrItems.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter("HALLS")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === "HALLS"
                  ? "bg-accent text-accent-ink"
                  : "bg-surface-raised text-ink-muted hover:text-ink"
              }`}
            >
              Halls & Rooms
            </button>

            <button
              type="button"
              onClick={() => setFilter("AMENITIES")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === "AMENITIES"
                  ? "bg-accent text-accent-ink"
                  : "bg-surface-raised text-ink-muted hover:text-ink"
              }`}
            >
              Amenities & Entrance
            </button>
          </div>

          <span className="text-ink-subtle text-xs">
            Ready for standard A4 landscape or portrait printing
          </span>
        </div>

        {/* Scrollable QR Cards Grid */}
        <div
          id="printable-qr-container"
          className="flex-1 overflow-y-auto p-6 bg-canvas grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {generating ? (
            <div className="col-span-full py-16 text-center text-ink-muted space-y-2">
              <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Generating high-density QR checkpoints...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-ink-subtle text-sm">
              No waypoints found in the current filter.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="qr-print-card p-5 rounded-2xl bg-white text-ink border border-border shadow-card flex flex-col items-center justify-between text-center space-y-3"
              >
                {/* Header branding on card */}
                <div className="w-full border-b border-border pb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block">
                    {institutionName}
                  </span>
                  <span className="text-xs font-bold text-accent">
                    {editionName} • Indoor Wayfinding
                  </span>
                </div>

                {/* Waypoint Title & Badges */}
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-ink tracking-tight leading-snug">
                    {item.label}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-ink-muted">
                    <span className="bg-surface-raised px-2 py-0.5 rounded-full font-bold">
                      {item.id}
                    </span>
                    <span className="bg-surface-raised px-2 py-0.5 rounded-full">
                      Floor {item.floor}
                    </span>
                  </div>
                </div>

                {/* High-res QR code image */}
                <div className="p-2 rounded-2xl bg-white border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.qrDataUrl}
                    alt={`QR Code for ${item.label}`}
                    className="w-48 h-48 object-contain"
                  />
                </div>

                {/* Call to action instruction */}
                <div className="space-y-1 w-full pt-1 border-t border-border">
                  <p className="text-[10px] font-bold text-ink uppercase tracking-wider leading-tight">
                    Scan with smartphone camera
                  </p>
                  <p className="text-[9px] text-ink-muted leading-tight">
                    Instantly view your location on the campus map & get walking directions
                  </p>
                  <p className="text-[8.5px] font-mono text-ink-subtle truncate pt-0.5">
                    {item.url}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

