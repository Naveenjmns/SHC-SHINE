import type { Prisma } from "@prisma/client";

/**
 * Single definition of "paid" and "meal eligible", shared by the food desk (claim check),
 * the food dashboard and the admin catering / revenue reports so their numbers agree.
 */

/** Delegation payment statuses that mean the fee has been received */
export const PAID_STATUSES = ["PAID", "VERIFIED"] as const;

export function isPaidStatus(paymentStatus: string | null | undefined): boolean {
  return !!paymentStatus && (PAID_STATUSES as readonly string[]).includes(paymentStatus);
}

/**
 * A delegate may claim a meal when their delegation has paid, or when at least one of their own
 * registrations has been approved (admin approval without a separate payment step).
 */
export function isMealEligible(
  paymentStatus: string | null | undefined,
  registrations: ReadonlyArray<{ status: string }>
): boolean {
  return isPaidStatus(paymentStatus) || registrations.some((r) => r.status === "CONFIRMED");
}

/** Prisma filter equivalent of isMealEligible for DelegationMember queries */
export const mealEligibleMemberWhere: Prisma.DelegationMemberWhereInput = {
  OR: [
    { delegation: { paymentStatus: { in: [...PAID_STATUSES] } } },
    { registrations: { some: { status: "CONFIRMED" } } },
  ],
};
