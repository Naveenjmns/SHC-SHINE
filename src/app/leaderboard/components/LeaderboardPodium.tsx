"use client";

import React from "react";
import { Trophy, Medal, Crown, Users } from "lucide-react";

export interface PodiumTeam {
  rank: 1 | 2 | 3;
  positionTitle: string;
  collegeName: string;
  teamName: string | null;
  participants: string[];
  score: number | null;
  result: string;
  award?: string;
}

interface LeaderboardPodiumProps {
  first: PodiumTeam | null;
  second: PodiumTeam | null;
  third: PodiumTeam | null;
}

export default function LeaderboardPodium({
  first,
  second,
  third,
}: LeaderboardPodiumProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-end max-w-5xl mx-auto">
      {/* 2nd Place (Silver) */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 order-2 md:order-1 flex flex-col justify-between md:min-h-[380px] shadow-xs">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Medal className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              2nd Place • Runner-Up
            </span>
          </div>

          {second ? (
            <>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mb-2 leading-tight uppercase">
                {second.collegeName}
              </h3>
              {second.teamName && (
                <p className="text-xs font-semibold text-[var(--ink-muted)] mb-3">
                  Team: {second.teamName}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Participants</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {second.participants.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--ink)] font-medium text-xs"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs font-semibold text-[var(--ink-muted)]">
              Pending Evaluation
            </div>
          )}
        </div>

        {second?.award && (
          <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] font-semibold text-[var(--ink-muted)]">
            Prize: {second.award}
          </div>
        )}
      </div>

      {/* 1st Place (Gold Trophy) - Elevated Center Stand */}
      <div className="bg-[var(--surface)] border-2 border-[#D9A441] rounded-2xl p-7 order-1 md:order-2 flex flex-col justify-between md:min-h-[440px] shadow-sm relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#D9A441] text-black text-[11px] font-bold px-3.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5" />
          <span>Champion</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4 mt-2">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-[#D9A441]/40 flex items-center justify-center text-[#D9A441]">
              <Trophy className="w-7 h-7" />
            </div>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-700">
              1st Place
            </span>
          </div>

          {first ? (
            <>
              <h3 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] mb-2 leading-tight uppercase">
                {first.collegeName}
              </h3>
              {first.teamName && (
                <p className="text-sm font-semibold text-[var(--ink-muted)] mb-3">
                  Team: {first.teamName}
                </p>
              )}

              <div className="mt-4 pt-3.5 border-t border-[var(--border)]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Champion Delegation</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {first.participants.map((name) => (
                    <span
                      key={name}
                      className="px-3 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--ink)] font-semibold text-xs sm:text-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs font-semibold text-[var(--ink-muted)]">
              Pending Evaluation
            </div>
          )}
        </div>

        {first?.award && (
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800 text-xs font-bold text-[#D9A441] flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" />
            <span>Prize: {first.award}</span>
          </div>
        )}
      </div>

      {/* 3rd Place (Bronze) */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 order-3 flex flex-col justify-between md:min-h-[380px] shadow-xs">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 flex items-center justify-center text-orange-700 dark:text-orange-400">
              <Medal className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800">
              3rd Place • Finalist
            </span>
          </div>

          {third ? (
            <>
              <h3 className="text-xl sm:text-2xl font-bold text-[var(--ink)] mb-2 leading-tight uppercase">
                {third.collegeName}
              </h3>
              {third.teamName && (
                <p className="text-xs font-semibold text-[var(--ink-muted)] mb-3">
                  Team: {third.teamName}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-[var(--border)]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Participants</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {third.participants.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--ink)] font-medium text-xs"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs font-semibold text-[var(--ink-muted)]">
              Pending Evaluation
            </div>
          )}
        </div>

        {third?.award && (
          <div className="mt-4 pt-3 border-t border-[var(--border)] text-[11px] font-semibold text-[var(--ink-muted)]">
            Prize: {third.award}
          </div>
        )}
      </div>
    </div>
  );
}

