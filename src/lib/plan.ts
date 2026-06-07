import { config } from "@/lib/config";

export type PlanId = "local" | "free" | "starter" | "growth" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  promptsPerAudit: number;
  assetsPerMonth: number;
  competitors: number;
  rescanDays: number; // re-audit cadence for lift tracking
}

export const PLANS: Record<PlanId, Plan> = {
  local: {
    id: "local",
    name: "Local (unlimited)",
    priceMonthly: 0,
    promptsPerAudit: 9999,
    assetsPerMonth: 9999,
    competitors: 50,
    rescanDays: 1,
  },
  free: {
    id: "free",
    name: "Free audit",
    priceMonthly: 0,
    promptsPerAudit: 12,
    assetsPerMonth: 0,
    competitors: 3,
    rescanDays: 30,
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 49,
    promptsPerAudit: 40,
    assetsPerMonth: 20,
    competitors: 5,
    rescanDays: 7,
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceMonthly: 149,
    promptsPerAudit: 120,
    assetsPerMonth: 80,
    competitors: 10,
    rescanDays: 3,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 299,
    promptsPerAudit: 300,
    assetsPerMonth: 250,
    competitors: 20,
    rescanDays: 1,
  },
};

/**
 * Without Stripe wired, everything runs on the unlimited local plan so the
 * product is fully usable in development. With Stripe, look the user's plan up
 * (left as a stub keyed to 'free' until billing/auth is connected).
 */
export function currentPlan(): Plan {
  if (!config.stripe.enabled) return PLANS.local;
  return PLANS.free;
}
