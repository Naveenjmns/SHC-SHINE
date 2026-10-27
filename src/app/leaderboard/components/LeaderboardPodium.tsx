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
      <div className="bg-surface border border-border rounded-2xl p-6 order-2 md:order-1 flex flex-col justify-between md:min-h-[380px] shadow-card">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-11 h-11 rounded-[12px] bg-surface-raised flex items-center justify-center text-ink-muted">
              <Medal className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-ink-muted bg-surface-raised px-3 py-1 rounded-full">
              2nd Place • Runner-Up
            </span>
          </div>

          {second ? (
            <>
              <h3 className="text-xl sm:text-2xl font-bold text-ink mb-2 leading-tight">
                {second.collegeName}
              </h3>
              {second.teamName && (
                <p className="text-xs font-semibold text-ink-muted mb-3">
                  Team: {second.teamName}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs font-semibold text-ink-muted flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Participants</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {second.participants.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-full bg-surface-raised text-ink font-medium text-xs"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs font-semibold text-ink-muted">
              Pending Evaluation
            </div>
          )}
        </div>

        {second?.award && (
          <div className="mt-4 pt-3 border-t border-border text-xs font-medium text-ink-muted">
            Prize: {second.award}
          </div>
        )}
      </div>

      {/* 1st Place (Gold Trophy) - Elevated Center Stand */}
      <div className="bg-surface border-2 border-gold rounded-3xl p-7 order-1 md:order-2 flex flex-col justify-between md:min-h-[440px] shadow-elevated relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-gold-ink text-xs font-bold px-3.5 py-1 rounded-full flex items-center gap-1.5">
          <Crown className="w-3.5 h-3.5" />
          <span>Champion</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4 mt-2">
            <div className="w-12 h-12 rounded-[12px] bg-gold-muted flex items-center justify-center text-gold">
              <Trophy className="w-7 h-7" />
            </div>
            <span className="text-xs font-semibold text-gold-ink bg-gold-muted px-3 py-1 rounded-full">
              1st Place
            </span>
          </div>

          {first ? (
            <>
              <h3 className="text-2xl sm:text-3xl font-bold text-ink mb-2 leading-tight">
                {first.collegeName}
              </h3>
              {first.teamName && (
                <p className="text-sm font-semibold text-ink-muted mb-3">
                  Team: {first.teamName}
                </p>
              )}

              <div className="mt-4 pt-3.5 border-t border-border">
                <div className="text-xs font-semibold text-accent flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Champion Delegation</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {first.participants.map((name) => (
                    <span
                      key={name}
                      className="px-3 py-1 rounded-full bg-surface-raised text-ink font-semibold text-xs sm:text-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs font-semibold text-ink-muted">
              Pending Evaluation
            </div>
          )}
        </div>

        {first?.award && (
          <div className="mt-4 pt-3 border-t border-border text-sm font-semibold text-ink flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-gold shrink-0" />
            <span>Prize: {first.award}</span>
          </div>
        )}
      </div>

      {/* 3rd Place (Bronze) */}
      <div className="bg-surface border border-border rounded-2xl p-6 order-3 flex flex-col justify-between md:min-h-[380px] shadow-card">
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-11 h-11 rounded-[12px] bg-[#B87333]/10 flex items-center justify-center text-[#9A5B26]">
              <Medal className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-[#7A4A1F] bg-[#B87333]/10 px-3 py-1 rounded-full">
              3rd Place • Finalist
            </span>
          </div>

          {third ? (
            <>
              <h3 className="text-xl sm:text-2xl font-bold text-ink mb-2 leading-tight">
                {third.collegeName}
              </h3>
              {third.teamName && (
                <p className="text-xs font-semibold text-ink-muted mb-3">
                  Team: {third.teamName}
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs font-semibold text-ink-muted flex items-center gap-1.5 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Participants</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {third.participants.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-full bg-surface-raised text-ink font-medium text-xs"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs font-semibold text-ink-muted">
              Pending Evaluation
            </div>
          )}
        </div>

        {third?.award && (
          <div className="mt-4 pt-3 border-t border-border text-xs font-medium text-ink-muted">
            Prize: {third.award}
          </div>
        )}
      </div>
    </div>
  );
}

