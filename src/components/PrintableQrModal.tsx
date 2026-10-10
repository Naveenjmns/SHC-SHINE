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
              dark: "#000000",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
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
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .qr-print-card {
            page-break-inside: avoid;
            break-inside: avoid;
            border: 2px solid #000000 !important;
            box-shadow: none !important;
            margin-bottom: 24px !important;
            background: white !important;
            color: black !important;
          }
        }
      `}} />

      <div className="bg-[#0B0A0A] border border-stone-800 rounded-3xl shadow-2xl flex flex-col w-full max-w-5xl h-[92vh] max-h-[850px] overflow-hidden text-stone-100">
        {/* Header Bar */}
        <header className="no-print px-6 py-4 border-b border-stone-800/80 bg-[#121111]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B1A]/10 border border-[#FF6B1A]/20 flex items-center justify-center text-[#FF6B1A]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Printable Venue QR Checkpoints
              </h2>
              <p className="text-xs text-stone-400">
                Generate high-resolution printable signage for doors, halls, and junctions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={generating || qrItems.length === 0}
              className="px-4 py-2 rounded-xl bg-[#FF6B1A] hover:bg-[#E8551F] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#FF6B1A]/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Checkpoints</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Filter controls */}
        <div className="no-print px-6 py-2.5 bg-[#171515] border-b border-stone-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400 font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </span>

            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                filter === "ALL"
                  ? "bg-[#FF6B1A] text-white"
                  : "bg-stone-900 text-stone-400 hover:text-white"
              }`}
            >
              All ({qrItems.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter("HALLS")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                filter === "HALLS"
                  ? "bg-[#FF6B1A] text-white"
                  : "bg-stone-900 text-stone-400 hover:text-white"
              }`}
            >
              Halls & Rooms
            </button>

            <button
              type="button"
              onClick={() => setFilter("AMENITIES")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                filter === "AMENITIES"
                  ? "bg-[#FF6B1A] text-white"
                  : "bg-stone-900 text-stone-400 hover:text-white"
              }`}
            >
              Amenities & Entrance
            </button>
          </div>

          <span className="text-stone-500 text-[11px]">
            Ready for standard A4 landscape or portrait printing
          </span>
        </div>

        {/* Scrollable QR Cards Grid */}
        <div
          id="printable-qr-container"
          className="flex-1 overflow-y-auto p-6 bg-[#0E0D0D] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {generating ? (
            <div className="col-span-full py-16 text-center text-stone-400 space-y-2">
              <div className="w-8 h-8 border-2 border-[#FF6B1A]/20 border-t-[#FF6B1A] rounded-full animate-spin mx-auto" />
              <p className="text-xs">Generating high-density QR checkpoints...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full py-16 text-center text-stone-500 text-xs">
              No waypoints found in the current filter.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="qr-print-card p-5 rounded-2xl bg-white text-stone-900 border-2 border-stone-300 shadow-md flex flex-col items-center justify-between text-center space-y-3"
              >
                {/* Header branding on card */}
                <div className="w-full border-b border-stone-200 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    {institutionName}
                  </span>
                  <span className="text-xs font-black uppercase tracking-tight text-[#FF6B1A]">
                    {editionName} • Indoor Wayfinding
                  </span>
                </div>

                {/* Waypoint Title & Badges */}
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-stone-900 tracking-tight leading-snug">
                    {item.label}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-stone-600">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 font-bold">
                      {item.id}
                    </span>
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                      Floor {item.floor}
                    </span>
                  </div>
                </div>

                {/* High-res QR code image */}
                <div className="p-2 rounded-xl bg-white border border-stone-200 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.qrDataUrl}
                    alt={`QR Code for ${item.label}`}
                    className="w-48 h-48 object-contain"
                  />
                </div>

                {/* Call to action instruction */}
                <div className="space-y-1 w-full pt-1 border-t border-stone-200">
                  <p className="text-[10px] font-bold text-stone-800 uppercase tracking-wider leading-tight">
                    Scan with smartphone camera
                  </p>
                  <p className="text-[9px] text-stone-500 leading-tight">
                    Instantly view your location on the campus map & get walking directions
                  </p>
                  <p className="text-[8.5px] font-mono text-stone-400 truncate pt-0.5">
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

