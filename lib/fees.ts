import { PlatformFeeBreakdown } from '@/types';

export function calculatePlatformFee(dealValue: number): {
  platformFee: number;
  gst: number;
  total: number;
  breakdown: PlatformFeeBreakdown;
} {
  const FEE_PERCENT = 0.05;
  const MIN_FEE = 199;
  const GST_PERCENT = 0.18;

  const rawFee = Math.round(dealValue * FEE_PERCENT);
  const platformFee = Math.max(rawFee, MIN_FEE);
  const gst = Math.round(platformFee * GST_PERCENT);
  const total = dealValue + platformFee + gst;

  return {
    platformFee,
    gst,
    total,
    breakdown: { dealValue, platformFee, gst, total },
  };
}

export function formatRupees(paisa: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paisa / 100);
}

export function formatRupeesFromRupees(rupees: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}
