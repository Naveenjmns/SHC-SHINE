"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Theater,
  Laptop,
  MapPin,
  Clock,
  GraduationCap,
  Users,
  BookOpen,
  X,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";
import { formatDateSafe, formatTimeSafe } from "@/lib/dateUtils";

export interface CoordinatorInfo {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  imageUrl?: string | null;
}

export interface EventCardProps {
  id: string;
  name: string;
  description?: string | null;
  category: "ON_STAGE" | "OFF_STAGE";
  fee?: number;
  capacity?: number | null;
  venue?: string | null;
  dateTime?: string | Date;
  rules?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  staffCoordinator?: CoordinatorInfo | null;
  studentCoordinator?: CoordinatorInfo | null;
  coordinator?: CoordinatorInfo | null;
  staffCoordinatorName?: string | null;
  staffCoordinatorEmail?: string | null;
  staffCoordinatorPhone?: string | null;
  staffCoordinatorImageUrl?: string | null;
  studentCoordinatorName?: string | null;
  studentCoordinatorEmail?: string | null;
  studentCoordinatorPhone?: string | null;
  studentCoordinatorImageUrl?: string | null;
  icon?: React.ReactNode;
  index?: number;
}

export default function EventCard({
  id,
  name,
  description,
  category = "ON_STAGE",
  capacity,
  venue,
  dateTime,
  rules,
  imageUrl,
  logoUrl,
  staffCoordinator,
  studentCoordinator,
  coordinator,
  staffCoordinatorName,
  staffCoordinatorEmail,
  staffCoordinatorPhone,
  staffCoordinatorImageUrl,
  studentCoordinatorName,
  studentCoordinatorEmail,
  studentCoordinatorPhone,
  studentCoordinatorImageUrl,
  icon,
  index = 0,
}: EventCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const isOnStage = category === "ON_STAGE";
  const defaultIcon = isOnStage ? (
    <Theater className="w-5 h-5 text-[#FF6B1A]" />
  ) : (
    <Laptop className="w-5 h-5 text-[#D9A441]" />
  );

  const formattedTime = dateTime
    ? formatTimeSafe(dateTime, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const formattedDate = dateTime
    ? formatDateSafe(dateTime, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;


  // Resolve Staff Coordinator details
  const effectiveStaffName =
    staffCoordinatorName || staffCoordinator?.name || coordinator?.name;
  const effectiveStaffEmail =
    staffCoordinatorEmail || staffCoordinator?.email || coordinator?.email;
  const effectiveStaffPhone =
    staffCoordinatorPhone || staffCoordinator?.phone || coordinator?.phone;
  const effectiveStaffPhoto =
    staffCoordinatorImageUrl ||
    staffCoordinator?.imageUrl ||
    staffCoordinator?.avatarUrl ||
    coordinator?.avatarUrl;

  // Resolve Student Coordinator details
  const effectiveStudentName =
    studentCoordinatorName || studentCoordinator?.name;
  const effectiveStudentEmail =
    studentCoordinatorEmail || studentCoordinator?.email;
  const effectiveStudentPhone =
    studentCoordinatorPhone || studentCoordinator?.phone;
  const effectiveStudentPhoto =
    studentCoordinatorImageUrl ||
    studentCoordinator?.imageUrl ||
    studentCoordinator?.avatarUrl;

  const displayImage = imageUrl || logoUrl;

  return (
    <>
      <div
        className="fest-card p-6 flex flex-col justify-between group relative overflow-hidden h-full transition-all duration-300 hover:border-[#FF6B1A]/40"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div>
          {/* Top Banner if Image exists */}
          {displayImage && (
            <div className="relative w-full h-36 mb-4 rounded-2xl overflow-hidden border border-[#1C1917]/10 bg-stone-100 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage}
                alt={name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          )}

          {/* Category & Capacity header */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isOnStage
                  ? "bg-[#FF6B1A]/10 text-[#EA580C] border border-[#FF6B1A]/20"
                  : "bg-[#D9A441]/12 text-[#B45309] border border-[#D9A441]/30"
              }`}
            >
              {isOnStage ? <Theater className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
              {isOnStage ? "On-Stage" : "Off-Stage"}
            </span>

            {capacity ? (
              <span className="text-[11px] font-semibold text-[#57534E] bg-[#FAF8F5] px-2.5 py-0.5 rounded-lg border border-[#1C1917]/10 tabular-nums">
                Max {capacity} Slots
              </span>
            ) : (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                Open Capacity
              </span>
            )}
          </div>

          {/* Icon & Name */}
          <div className="flex items-center gap-3 mb-3">
            {!displayImage && (
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#1C1917]/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                {icon || defaultIcon}
              </div>
            )}
            <h3
              className="text-lg font-bold text-[#1C1917] group-hover:text-[#FF6B1A] transition-colors leading-snug"
              style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
            >
              {name}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-[#57534E] leading-relaxed mb-4 line-clamp-3">
            {description || "Compete against peer colleges in this signature fest competition."}
          </p>

          {/* Metadata & Dual Coordinators */}
          <div className="space-y-2 text-xs text-[#57534E] pt-3 border-t border-[#1C1917]/10 mb-5">
            {venue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#D9A441] shrink-0" />
                <span className="truncate">{venue}</span>
              </div>
            )}
            {formattedTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                <span>{formattedTime}</span>
              </div>
            )}

            {/* Staff Coordinator */}
            {effectiveStaffName && (
              <div className="flex items-center gap-2">
                {effectiveStaffPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={effectiveStaffPhoto}
                    alt={effectiveStaffName}
                    loading="lazy"
                    decoding="async"
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-[#FF6B1A] shrink-0" />
                )}
                <span className="truncate font-medium">
                  Staff: {effectiveStaffName}
                  {effectiveStaffPhone ? ` (${effectiveStaffPhone})` : ""}
                </span>
              </div>
            )}

            {/* Student Coordinator */}
            {effectiveStudentName && (
              <div className="flex items-center gap-2">
                {effectiveStudentPhoto ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={effectiveStudentPhoto}
                    alt={effectiveStudentName}
                    loading="lazy"
                    decoding="async"
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                )}
                <span className="truncate font-medium">
                  Student: {effectiveStudentName}
                  {effectiveStudentPhone ? ` (${effectiveStudentPhone})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Read More Action Button (Replaced Register button) */}
        <div className="pt-2 mt-auto">
          <button
            type="button"
            onClick={() => setShowDetailModal(true)}
            className="w-full text-xs font-bold py-2.5 px-4 rounded-xl border border-[#FF6B1A]/40 bg-[#FF6B1A]/10 text-[#EA580C] hover:bg-[#FF6B1A] hover:text-white transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs group-hover:border-[#FF6B1A]"
          >
            <span>Read More & View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Full Event Details Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-stone-100">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isOnStage
                        ? "bg-[#FF6B1A]/10 text-[#EA580C] border border-[#FF6B1A]/20"
                        : "bg-[#D9A441]/12 text-[#B45309] border border-[#D9A441]/30"
                    }`}
                  >
                    {isOnStage ? <Theater className="w-3 h-3" /> : <Laptop className="w-3 h-3 text-[#D9A441]" />}
                    {isOnStage ? "On-Stage Competition" : "Off-Stage Competition"}
                  </span>

                  {capacity ? (
                    <span className="text-[10px] font-semibold text-[#57534E] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#1C1917]/10 tabular-nums">
                      Max {capacity} Slots
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Unlimited Capacity
                    </span>
                  )}

                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Included in Delegate Pass
                  </span>
                </div>

                <h3
                  className="text-2xl sm:text-3xl font-black text-[#1C1917] tracking-tight"
                  style={{ fontFamily: "var(--font-outfit), Outfit, sans-serif" }}
                >
                  {name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="tap-target p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer shrink-0"
                aria-label="Close event details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Poster/Banner */}
            {displayImage && (
              <div className="relative w-full h-48 sm:h-56 mb-6 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImage}
                  alt={name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Event Description */}
            <div className="mb-6 p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs sm:text-sm text-[#1C1917] leading-relaxed">
              <strong className="block text-[11px] font-bold text-[#FF6B1A] uppercase tracking-wider mb-1">
                Event Overview
              </strong>
              {description || "Join this competition track and showcase your innovation, technical prowess, and creative expertise."}
            </div>

            {/* Venue & Schedule Strip */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {venue && (
                <div className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF8F5] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Competition Venue</div>
                    <div className="text-xs font-bold text-stone-900">{venue}</div>
                  </div>
                </div>
              )}

              {(formattedTime || formattedDate) && (
                <div className="p-3.5 rounded-xl border border-stone-200 bg-[#FAF8F5] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Scheduled Timing</div>
                    <div className="text-xs font-bold text-stone-900">
                      {formattedDate ? `${formattedDate} • ` : ""}{formattedTime || "Full Day"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dual Coordinators Profiles with Photo & Contact Details */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#FF6B1A]" />
                <span>Event Incharge Coordinators</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Staff Coordinator Card */}
                <div className="p-4 rounded-2xl border border-orange-200/80 bg-orange-50/40 flex items-start gap-3.5">
                  {effectiveStaffPhoto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={effectiveStaffPhoto}
                      alt={effectiveStaffName || "Staff Coordinator"}
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 rounded-full object-cover border-2 border-orange-300 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-orange-300 flex items-center justify-center text-orange-700 font-bold text-sm shrink-0 shadow-2xs">
                      {effectiveStaffName ? effectiveStaffName.charAt(0) : <GraduationCap className="w-6 h-6" />}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Faculty Incharge
                    </span>
                    <div className="font-extrabold text-sm text-stone-900 truncate">
                      {effectiveStaffName || "Staff Coordinator"}
                    </div>

                    {effectiveStaffPhone && (
                      <a
                        href={`tel:${effectiveStaffPhone}`}
                        className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-orange-600 font-medium mt-1 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-orange-500 shrink-0" />
                        <span className="font-mono">{effectiveStaffPhone}</span>
                      </a>
                    )}

                    {effectiveStaffEmail && (
                      <a
                        href={`mailto:${effectiveStaffEmail}`}
                        className="flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-orange-600 truncate mt-0.5 transition-colors"
                      >
                        <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{effectiveStaffEmail}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Student Coordinator Card */}
                <div className="p-4 rounded-2xl border border-blue-200/80 bg-blue-50/40 flex items-start gap-3.5">
                  {effectiveStudentPhoto ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={effectiveStudentPhoto}
                      alt={effectiveStudentName || "Student Coordinator"}
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 rounded-full object-cover border-2 border-blue-300 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-300 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0 shadow-2xs">
                      {effectiveStudentName ? effectiveStudentName.charAt(0) : <Users className="w-6 h-6" />}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                      Student Incharge
                    </span>
                    <div className="font-extrabold text-sm text-stone-900 truncate">
                      {effectiveStudentName || "Student Coordinator"}
                    </div>

                    {effectiveStudentPhone && (
                      <a
                        href={`tel:${effectiveStudentPhone}`}
                        className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-blue-600 font-medium mt-1 transition-colors"
                      >
                        <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="font-mono">{effectiveStudentPhone}</span>
                      </a>
                    )}

                    {effectiveStudentEmail && (
                      <a
                        href={`mailto:${effectiveStudentEmail}`}
                        className="flex items-center gap-1.5 text-[11px] text-stone-500 hover:text-blue-600 truncate mt-0.5 transition-colors"
                      >
                        <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{effectiveStudentEmail}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rules & Regulations Detailed Content */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF6B1A] mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Rules & Guidelines</span>
              </h4>
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-line font-normal">
                {rules || "1. Participants must bring valid college ID cards for physical verification.\n2. Decision of the jury & event incharge is final.\n3. General symposium code of conduct applies to all contestants."}
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="tap-target px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer w-full sm:w-auto"
              >
                Close Details
              </button>

              <Link
                href={`/register?eventId=${id}`}
                className="btn-ember text-xs sm:text-sm font-bold px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm"
              >
                <span>Register for {name}</span>
                <CheckCircle2 className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
