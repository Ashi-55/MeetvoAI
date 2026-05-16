/**
 * App utility helpers.
 * Keep exports stable because many UI components import from here.
 */

import type { PlatformFeeBreakdown } from '@/types';

export function calculatePlatformFee(dealValue: number): number {
  return Math.max(Math.round(dealValue * 0.05), 199);
}

export function getCheckoutBreakdown(dealValue: number): PlatformFeeBreakdown {
  const platformFee = calculatePlatformFee(dealValue);
  const gst = Math.round(platformFee * 0.18);
  const total = dealValue + platformFee + gst;
  return { dealValue, platformFee, gst, total };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Shadcn/ui components use this import.
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN');
}

export function formatTime(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getInitials(name: string): string {
  const cleaned = name.trim().replace(/\s+/g, ' ');
  if (!cleaned) return '';

  const parts = cleaned.split(' ');
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? '';
  return `${first}${second}`.toUpperCase();
}

export function detectExternalPayment(message: string): boolean {
  const m = message.toLowerCase();

  const hasUpi = /(\bupi\b|\bgpay\b|\bphonepe\b|\bpaytm\b)/.test(m);
  const hasBankDetails = /(bank account|account number|ifsc)/.test(m);
  const hasNeft = /\bneft\b/.test(m);
  const hasWhatsAppPay = /(whatsapp pay)/.test(m);
  const hasOutside = /(pay outside|direct payment)/.test(m);

  return hasUpi || hasBankDetails || hasNeft || hasWhatsAppPay || hasOutside;
}

export function timeAgo(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec}m ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}


