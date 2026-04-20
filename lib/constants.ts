export const SUBSCRIPTION_PLANS = {
  starting: {
    name: "Starting",
    price: 2000,
    priceYearly: 20000,
    razorpayPlanId: "",
    features: {
      maxAgents: 1,
      demosPerMonth: 5,
      priorityListing: false,
      customDomain: false,
      whatsappDeploy: false,
      analytics: "basic" as const,
    },
  },
  medium: {
    name: "Medium",
    price: 5000,
    priceYearly: 50000,
    razorpayPlanId: "",
    features: {
      maxAgents: 5,
      demosPerMonth: 20,
      priorityListing: false,
      customDomain: true,
      whatsappDeploy: true,
      analytics: "advanced" as const,
    },
  },
  business: {
    name: "Business",
    price: 15000,
    priceYearly: 150000,
    razorpayPlanId: "",
    features: {
      maxAgents: -1,
      demosPerMonth: -1,
      priorityListing: true,
      customDomain: true,
      whatsappDeploy: true,
      analytics: "full" as const,
    },
  },
} as const;

export const COMMISSION_RATES = {
  tier1: { deals: 3, rate: 0.1 },
  tier2: { deals: 10, rate: 0.08 },
  tier3: { deals: 25, rate: 0.06 },
  tier4: { deals: Number.POSITIVE_INFINITY, rate: 0.05 },
} as const;

export function getCommissionRate(completedDeals: number): number {
  if (completedDeals <= 3) return 0.1;
  if (completedDeals <= 10) return 0.08;
  if (completedDeals <= 25) return 0.06;
  return 0.05;
}
