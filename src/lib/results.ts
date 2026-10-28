/**
 * Shared interpretation of a registration's `result` text, used by the public leaderboard and
 * the admin championship report so both always agree.
 *
 * Coordinators store fixed codes (FIRST, SECOND, THIRD, FINALIST, SPECIAL); admins may also type
 * free text, which is classified with whole-word rules. Runner-up wording is resolved before
 * plain ordinals so "First Runner-Up" is 2nd place, not 1st.
 */
export type ResultClass =
  | { kind: "podium"; rank: 1 | 2 | 3 }
  | { kind: "award" } // finalist, special mention, merit, consolation…
  | { kind: "none" }; // empty, participation, absent, disqualified, unrecognised

const CODE_MAP: Record<string, ResultClass> = {
  FIRST: { kind: "podium", rank: 1 },
  SECOND: { kind: "podium", rank: 2 },
  THIRD: { kind: "podium", rank: 3 },
  FINALIST: { kind: "award" },
  SPECIAL: { kind: "award" },
  NONE: { kind: "none" },
};

export function classifyResult(result: string | null | undefined): ResultClass {
  if (!result) return { kind: "none" };
  const raw = result.trim();
  if (!raw) return { kind: "none" };
  const code = CODE_MAP[raw.toUpperCase()];
  if (code) return code;

  const t = raw.toLowerCase();
  const has = (re: RegExp) => re.test(t);

  if (has(/\b(disqualified|absent|no[\s-]?show|participat(ed|ion|ant)|none)\b/)) return { kind: "none" };

  if (has(/runner[\s-]*up/)) {
    // "second/2nd runner-up" is third place; "runner-up" or "first/1st runner-up" is second
    if (has(/\b(second|2nd)\s+runner/)) return { kind: "podium", rank: 3 };
    return { kind: "podium", rank: 2 };
  }

  if (has(/\b(1st|first|winner|gold|champions?)\b/) || t === "1") return { kind: "podium", rank: 1 };
  if (has(/\b(2nd|second|silver)\b/) || t === "2") return { kind: "podium", rank: 2 };
  if (has(/\b(3rd|third|bronze)\b/) || t === "3") return { kind: "podium", rank: 3 };

  if (has(/\b(finalist|special|mention|merit|consolation|appreciation|distinction)\b/)) return { kind: "award" };
  return { kind: "none" };
}

/** Podium rank (1–3) or null when the result is not a podium place */
export function parseRank(result: string | null | undefined): 1 | 2 | 3 | null {
  const c = classifyResult(result);
  return c.kind === "podium" ? c.rank : null;
}
