'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Bot, Building2, Check, ShieldCheck, Sparkles, Users } from 'lucide-react';

type Billing = 'monthly' | 'annual';
type Plan = {
  title: string;
  audience: 'Business' | 'Builder' | 'Enterprise';
  monthly: number | null;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
};

function moneyINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function price(plan: Plan, billing: Billing) {
  if (plan.monthly === null) return { main: 'Custom', sub: 'For larger teams and managed rollouts' };
  if (billing === 'annual') return { main: moneyINR(Math.round(plan.monthly * 12 * 0.9)), sub: 'per year, 10% saved' };
  return { main: moneyINR(plan.monthly), sub: 'per month' };
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const Icon = plan.audience === 'Business' ? Building2 : plan.audience === 'Builder' ? Bot : Users;
  const planPrice = price(plan, billing);

  return (
    <div className={`relative flex h-full flex-col rounded-[20px] border p-6 transition duration-200 hover:-translate-y-1 ${plan.highlight ? 'border-[#5B5EF7]/70 bg-[#5B5EF7]/10 shadow-[0_24px_80px_rgba(91,94,247,0.18)]' : 'border-white/10 bg-white/[0.035]'}`}>
      {plan.highlight && (
        <div className="absolute right-5 top-5 rounded-full border border-[#00C2A8]/30 bg-[#00C2A8]/10 px-3 py-1 text-xs font-black text-[#00C2A8]">Recommended</div>
      )}
      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/10 bg-white/[0.05] text-[#00C2A8]">
        <Icon size={20} />
      </div>
      <p className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-[#A8B3CF]">{plan.audience}</p>
      <h3 className="mt-2 text-2xl font-black text-white">{plan.title}</h3>
      <p className="mt-3 min-h-[52px] text-sm leading-6 text-[#A8B3CF]">{plan.description}</p>
      <div className="mt-6">
        <p className="text-4xl font-black tracking-[-0.03em] text-white">{planPrice.main}</p>
        <p className="mt-1 text-sm text-[#A8B3CF]">{planPrice.sub}</p>
      </div>
      <div className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <div key={feature} className="flex gap-3 text-sm leading-6 text-[#D7DEF4]">
            <Check size={17} className="mt-1 shrink-0 text-[#00C2A8]" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
      <Link href={plan.href} className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-[14px] px-4 py-3 text-sm font-black transition ${plan.highlight ? 'bg-[#5B5EF7] text-white hover:bg-[#4B4EE8]' : 'border border-white/10 bg-white text-[#0B1020] hover:bg-[#DDE3FF]'}`}>
        {plan.cta} <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');

  const plans: Plan[] = [
    {
      title: 'Business Starter',
      audience: 'Business',
      monthly: 2999,
      description: 'For SMBs exploring AI automation with guided Studio output.',
      features: ['AI Studio builds and workflow previews', 'Marketplace access', 'Escrow protected collaboration', 'Basic deployment tracking'],
      cta: 'Start as business',
      href: '/signup?role=business',
    },
    {
      title: 'Builder Growth',
      audience: 'Builder',
      monthly: 3499,
      description: 'For builders who want serious clients, published agents, and paid delivery.',
      features: ['Publish agents and portfolio cards', 'Buyer marketplace visibility', 'Escrow deal management', 'Client messages and delivery tools'],
      cta: 'Start as builder',
      href: '/signup?role=builder',
      highlight: true,
    },
    {
      title: 'Business Growth',
      audience: 'Business',
      monthly: 3999,
      description: 'For teams running multiple automations and builder projects.',
      features: ['Higher AI Studio limits', 'Suggested actions dashboard', 'Priority builder discovery', 'Automation and website deployment history'],
      cta: 'Choose Growth',
      href: '/signup?role=business',
    },
    {
      title: 'Enterprise',
      audience: 'Enterprise',
      monthly: null,
      description: 'For managed AI rollouts, governance, approvals, and support.',
      features: ['Custom workflows and onboarding', 'Admin controls and approval flows', 'Fraud and dispute monitoring', 'Dedicated implementation support'],
      cta: 'Contact sales',
      href: '/signup',
    },
  ];

  return (
    <main className="premium-shell min-h-screen px-4 py-24 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[#A8B3CF]">
            <Sparkles size={15} className="text-[#00C2A8]" />
            Premium plans for AI adoption and AI delivery
          </div>
          <h1 className="text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">Simple pricing for businesses, builders, and enterprise AI teams.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#A8B3CF]">
            Start small, prove value, then scale into more workflows, builders, automations, and deployments.
          </p>
          <div className="mx-auto mt-8 inline-flex rounded-[16px] border border-white/10 bg-white/[0.045] p-1">
            {(['monthly', 'annual'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setBilling(item)}
                className={`rounded-[12px] px-5 py-2.5 text-sm font-black capitalize transition ${billing === item ? 'bg-[#5B5EF7] text-white shadow-[0_12px_28px_rgba(91,94,247,0.22)]' : 'text-[#A8B3CF] hover:text-white'}`}
              >
                {item === 'annual' ? 'Annual -10%' : 'Monthly'}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => <PlanCard key={plan.title} plan={plan} billing={billing} />)}
        </section>

        <section className="mt-16 grid gap-5 lg:grid-cols-3">
          {[
            [ShieldCheck, 'Escrow built in', 'Every paid project can use payment protection and approval-based release.'],
            [BadgeCheck, 'Trust signals', 'Builder verification, response time, ratings, languages, and completed work improve buyer confidence.'],
            [Bot, 'Studio-first growth', 'AI Studio gives buyers clarity before they spend and builders cleaner project briefs.'],
          ].map(([Icon, title, body]) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return (
              <div key={title as string} className="rounded-[20px] border border-white/10 bg-white/[0.035] p-6">
                <FeatureIcon size={24} className="text-[#00C2A8]" />
                <h3 className="mt-5 text-xl font-black text-white">{title as string}</h3>
                <p className="mt-3 text-sm leading-6 text-[#A8B3CF]">{body as string}</p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
