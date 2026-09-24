import type { InferSelectModel } from "drizzle-orm";
import { users } from "../../../database/schema";

export type UserPlan = InferSelectModel<typeof users>["plan"];

/*
 * ============================================================
 * USBOOTH PLAN LIMITS
 * ============================================================
 *
 * FREE
 * - 2 participants
 * - 3 booths
 *
 * PLUS
 * - 3 participants
 * - 5 booths
 *
 * PRO
 * - 5 participants
 * - 10 booths
 *
 * Special full-access accounts are handled separately below.
 * They keep their normal database plan but bypass restrictions.
 */

export const PLAN_LIMITS = {
  FREE: {
    maxParticipants: 2,
    maxBooths: 3,
  },

  PLUS: {
    maxParticipants: 3,
    maxBooths: 5,
  },

  PRO: {
    maxParticipants: 5,
    maxBooths: 10,
  },
} as const;

/*
 * ============================================================
 * FULL ACCESS / ADMIN ACCOUNTS
 * ============================================================
 *
 * These accounts have unrestricted access regardless of the
 * plan stored on their user record.
 *
 * Keep these emails lowercase.
 */

export const FULL_ACCESS_EMAILS = new Set([
  "usboothphotographs@gmail.com",
  "vawesh.srivastava@gmail.com",
  "garimagupta67576@gmail.com",
]);

/*
 * ============================================================
 * PLAN HELPERS
 * ============================================================
 */

export function getPlanLimits(plan: UserPlan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}

/*
 * Check whether an email belongs to a full-access account.
 */

export function hasFullAccess(
  email: string | null | undefined
): boolean {
  if (!email) {
    return false;
  }

  return FULL_ACCESS_EMAILS.has(
    email.trim().toLowerCase()
  );
}

/*
 * Get the effective limits for a user.
 *
 * null means unlimited.
 */

export function getEffectivePlanLimits(
  plan: UserPlan,
  email?: string | null
) {
  if (hasFullAccess(email)) {
    return {
      maxParticipants: null,
      maxBooths: null,
      unlimited: true,
    };
  }

  const limits = getPlanLimits(plan);

  return {
    ...limits,
    unlimited: false,
  };
}

/*
 * ============================================================
 * FEATURE ACCESS
 * ============================================================
 *
 * We'll use this as the central entitlement check as we add
 * premium templates, stickers, filters, face effects, etc.
 */

export type PremiumFeature =
  | "PLUS"
  | "PRO";

export function canAccessRequiredPlan(
  plan: UserPlan,
  requiredPlan: "FREE" | "PLUS" | "PRO",
  email?: string | null,
  unlimited = false
): boolean {
  if (requiredPlan === "FREE" || unlimited) return true;
  return canAccessPlanFeature(plan, requiredPlan, email);
}

export function canAccessPlanFeature(
  plan: UserPlan,
  requiredPlan: PremiumFeature,
  email?: string | null
): boolean {
  /*
   * Full-access accounts can use everything.
   */
  if (hasFullAccess(email)) {
    return true;
  }

  if (requiredPlan === "PLUS") {
    return (
      plan === "PLUS" ||
      plan === "PRO"
    );
  }

  if (requiredPlan === "PRO") {
    return plan === "PRO";
  }

  return false;
}

/*
 * ============================================================
 * DISPLAY HELPERS
 * ============================================================
 */

export function getPlanDisplayName(
  plan: UserPlan,
  email?: string | null
): string {
  if (hasFullAccess(email)) {
    return "FULL ACCESS";
  }

  return plan;
}
