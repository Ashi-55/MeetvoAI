'use client';

import { useMemo, useState } from 'react';
import { Check, Shield, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

function moneyINR(n: number) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${n}`;
  }
}

type Billing = 'monthly' | 'annual';

function PlanCard({
  title,
  price,
  highlight,
  features,
  includePlatformFee,
  platformFeeText,
  button,
}: {
  title: string;
  price: number;
  highlight?: boolean;
  features: Array<{ label: string; enabled: boolean }>;
  includePlatformFee?: boolean;
  platformFeeText?: string;
  button: { label: string; variant: 'solid' | 'outline' | 'purple' | 'teal' };
}) {
  const btnClass =
    button.variant === 'solid'
      ? 'bg-brand hover:bg-brand2 text-white'
      : button.variant === 'purple'
      ? 'bg-brand2 hover:bg-brand2/90 text-white'
      : button.variant === 'teal'
      ? 'bg-teal-500 hover:bg-teal-600 text-white'
      : 'bg-transparent border border-border text-text3 hover:bg-surface2';

  return (
    <Card className={`p-6 border-border bg-surface ${highlight ? 'ring-2 ring-brand/40' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-text3 font-semibold">{title}</div>
          {highlight ? <div className="text-xs mt-1 inline-flex bg-brand/15 border border-brand/30 text-brand px-2 py-1 rounded-full">Popular</div> : null}
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <div className="text-3xl font-extrabold text-text">{moneyINR(price)}</div>
        <div className="text-text3 text-sm">/ {/** label is provided by caller below */} </div>
      </div>

      {includePlatformFee && platformFeeText ? (
        <div className="mt-3 text-text3 text-sm">Platform fee: <span className="text-text font-semibold">{platformFeeText}</span></div>
      ) : null}

      <ul className="mt-5 space-y-2">
        {features.map((f) => (
          <li key={f.label} className="flex items-center gap-2 text-sm">
            <span className={f.enabled ? 'text-green' : 'text-text3'}>
              {f.enabled ? <Check size={16} /> : <span className="inline-block w-[16px] h-[16px] rounded-full border border-border" />}
            </span>
            <span className={f.enabled ? 'text-text' : 'text-text3'}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Button className={`w-full ${btnClass}`}>{button.label}</Button>
      </div>
    </Card>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');

  const annualDiscount = 0.2;
  const computed = (monthly: number) => {
    if (billing === 'monthly') return monthly;
    // annual shows monthly-equivalent after 20% off (simple UX)
    return Math.round(monthly * (1 - annualDiscount));
  };

  const billingLabel = billing === 'monthly' ? 'month' : 'month (annual billed)';

  const savings = billing === 'annual' ? '20% OFF' : null;

  const businesses = [
    {
      key: 'free',
      title: 'Free',
      monthly: 0,
      features: [
        { label: 'Access to marketplace', enabled: true },
        { label: 'Basic escrow tracking', enabled: true },
        { label: 'AI Studio deployments', enabled: false },
        { label: 'Priority verification', enabled: false },
      ],
      button: { label: 'Get Started Free', variant: 'outline' as const },
    },
    {
      key: 'starter',
      title: 'Starter',
      monthly: 999,
      features: [
        { label: 'Everything in Free', enabled: true },
        { label: 'AI Studio builds', enabled: true },
        { label: 'Email notifications', enabled: true },
        { label: 'Standard verification', enabled: true },
      ],
      button: { label: 'Start Free Trial', variant: 'teal' as const },
    },
    {
      key: 'growth',
      title: 'Growth',
      monthly: 2499,
      highlight: true,
      features: [
        { label: 'Everything in Starter', enabled: true },
        { label: 'More deployments + history', enabled: true },
        { label: 'Advanced analytics', enabled: true },
        { label: 'Faster support', enabled: true },
      ],
      button: { label: 'Start Free Trial', variant: 'teal' as const },
    },
    {
      key: 'pro',
      title: 'Pro',
      monthly: 4999,
      features: [
        { label: 'Everything in Growth', enabled: true },
        { label: 'Custom workflows', enabled: true },
        { label: 'Dedicated onboarding', enabled: true },
        { label: 'Priority verification', enabled: true },
      ],
      button: { label: 'Contact Sales', variant: 'purple' as const },
    },
  ];

  const builders = [
    {
      key: 'bfree',
      title: 'Free',
      monthly: 0,
      features: [
        { label: 'List agents on marketplace', enabled: true },
        { label: 'Basic lead tracking', enabled: true },
        { label: 'Lower platform fee', enabled: false },
        { label: 'Verification boost', enabled: false },
      ],
      includePlatformFee: true,
      platformFeeText: '10%+',
      button: { label: 'Get Started Free', variant: 'outline' as const },
    },
    {
      key: 'bstarter',
      title: 'Starter',
      monthly: 2000,
      features: [
        { label: 'Everything in Free', enabled: true },
        { label: 'Higher visibility', enabled: true },
        { label: 'Analytics for deals', enabled: true },
        { label: 'Verification boost', enabled: true },
      ],
      includePlatformFee: true,
      platformFeeText: '8%+',
      button: { label: 'Start Free Trial', variant: 'teal' as const },
    },
    {
      key: 'bgrowth',
      title: 'Growth',
      monthly: 5000,
      highlight: true,
      features: [
        { label: 'Everything in Starter', enabled: true },
        { label: 'More deployments + workspace', enabled: true },
        { label: 'Priority review queue', enabled: true },
        { label: 'Team seats', enabled: true },
      ],
      includePlatformFee: true,
      platformFeeText: '6%+',
      button: { label: 'Start Free Trial', variant: 'teal' as const },
    },
    {
      key: 'bpro',
      title: 'Business',
      monthly: 15000,
      features: [
        { label: 'Everything in Growth', enabled: true },
        { label: 'Dedicated account manager', enabled: true },
        { label: 'Custom pricing & SLA', enabled: true },
        { label: 'Enterprise verification support', enabled: true },
      ],
      includePlatformFee: true,
      platformFeeText: '4%+',
      button: { label: 'Contact Sales', variant: 'purple' as const },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Simple, Transparent Pricing</h1>
          <p className="text-text3 mt-2">Choose monthly or annual billing. Annual gives you 20% off.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface rounded-xl border border-border p-2">
            <Button
              className={billing === 'monthly' ? 'bg-brand hover:bg-brand2 text-white' : 'bg-transparent border border-border text-text3 hover:bg-surface2'}
              onClick={() => setBilling('monthly')}
              variant="outline"
            >
              Monthly
            </Button>
            <Button
              className={billing === 'annual' ? 'bg-brand hover:bg-brand2 text-white' : 'bg-transparent border border-border text-text3 hover:bg-surface2'}
              onClick={() => setBilling('annual')}
              variant="outline"
            >
              Annual
            </Button>
          </div>
          {savings ? <Badge className="bg-teal-500/10 border border-teal-500/30 text-teal-200">{savings}</Badge> : null}
        </div>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="businesses">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="businesses" className="flex-1">🏢 For Businesses</TabsTrigger>
            <TabsTrigger value="builders" className="flex-1">👨‍💻 For Builders</TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {businesses.map((p) => (
                <div key={p.key}>
                  <PlanCard
                    title={p.title}
                    price={computed(p.monthly)}
                    highlight={p.highlight}
                    features={p.features}
                    button={p.button}
                  />
                  <div className="mt-2 text-center text-xs text-text3">per {billingLabel}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="builders" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {builders.map((p) => (
                <div key={p.key}>
                  <PlanCard
                    title={p.title}
                    price={computed(p.monthly)}
                    highlight={p.highlight}
                    features={p.features}
                    includePlatformFee={p.includePlatformFee}
                    platformFeeText={p.platformFeeText}
                    button={p.button}
                  />
                  <div className="mt-2 text-center text-xs text-text3">per {billingLabel}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-extrabold">FAQ</h2>
        <p className="text-text3 mt-2">Quick answers before you upgrade.</p>

        <Accordion type="single" collapsible className="mt-6">
          <AccordionItem value="marketplace">
            <AccordionTrigger>About marketplace</AccordionTrigger>
            <AccordionContent>
              MeetvoAI verifies builders and helps businesses discover proven agents with transparent escrow-protected workflows.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="escrow">
            <AccordionTrigger>Escrow</AccordionTrigger>
            <AccordionContent>
              Payments are held securely until work is delivered and approved. Disputes are reviewed by the MeetvoAI team.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="studio">
            <AccordionTrigger>AI Studio</AccordionTrigger>
            <AccordionContent>
              Use Studio to generate, configure, and deploy AI agents. Track builds, revisions, and deployment status over time.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hosting">
            <AccordionTrigger>Cloud hosting</AccordionTrigger>
            <AccordionContent>
              Deployments can be hosted so your agent runs live and responds through a delivery URL shared with the business.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="verification">
            <AccordionTrigger>Verification & trust</AccordionTrigger>
            <AccordionContent>
              Verification reduces risk. Builders and businesses gain visibility based on quality signals and successful deal history.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

