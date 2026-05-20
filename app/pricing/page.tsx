'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Billing = 'monthly' | 'annual';

type Plan = {
  title: string;
  monthly: number | null;
  highlight?: boolean;
  button: string;
};

function moneyINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function planPrice(plan: Plan, billing: Billing) {
  if (plan.monthly === null) return { main: 'Custom', sub: 'Talk to sales' };
  if (billing === 'monthly') return { main: moneyINR(plan.monthly), sub: 'per month' };
  return { main: moneyINR(Math.round(plan.monthly * 12 * 0.9)), sub: 'per year, 10% off' };
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const price = planPrice(plan, billing);

  return (
    <Card className={`relative overflow-hidden rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-5 ${plan.highlight ? 'ring-2 ring-[#8B5CF6]/55' : ''}`}>
      {plan.highlight && (
        <div className="absolute right-4 top-4">
          <Badge className="border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#d8b4fe]">Popular</Badge>
        </div>
      )}
      <div className="flex h-full min-h-[230px] flex-col">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B5CF6]/16 text-[#d8b4fe]">
          <Sparkles size={18} />
        </div>
        <h3 className="mt-5 text-xl font-extrabold text-white">{plan.title}</h3>
        <div className="mt-4">
          <div className="text-3xl font-black text-white">{price.main}</div>
          <div className="mt-1 text-sm text-[#9490B5]">{price.sub}</div>
        </div>
        {billing === 'annual' && plan.monthly !== null && (
          <div className="mt-3 text-xs font-semibold text-[#68D391]">
            Save {moneyINR(Math.round(plan.monthly * 12 * 0.1))} yearly
          </div>
        )}
        <div className="mt-5 rounded-xl border border-[#1E1B3A] bg-[#08080F] px-4 py-3 text-sm text-[#b8aee0]">
          Features will update soon.
        </div>
        <Button className="mt-auto w-full rounded-xl bg-[#8B5CF6] font-bold text-white hover:bg-[#7C3AED]">
          {plan.button}
        </Button>
      </div>
    </Card>
  );
}

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly');

  const builderPlans: Plan[] = [
    { title: 'Starter', monthly: 1999, button: 'Choose Starter' },
    { title: 'Growth', monthly: 3499, highlight: true, button: 'Choose Growth' },
    { title: 'Pro Agency', monthly: 7999, button: 'Choose Pro Agency' },
  ];

  const businessPlans: Plan[] = [
    { title: 'Starter', monthly: 2999, button: 'Choose Starter' },
    { title: 'Growth', monthly: 3999, highlight: true, button: 'Choose Growth' },
    { title: 'Pro Agency', monthly: 8999, button: 'Choose Pro Agency' },
    { title: 'Enterprise', monthly: null, button: 'Contact Sales' },
  ];

  return (
    <main className="min-h-screen bg-[#08080F] px-4 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ae9bc9]">AI Studio Pricing</p>
            <h1 className="mt-3 text-3xl font-black">Simple plans for builders and businesses</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#9490B5]">
              Pay monthly or choose yearly billing with a 10% offer.
            </p>
          </div>

          <div className="flex rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-1">
            {(['monthly', 'annual'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setBilling(item)}
                className={`rounded-xl px-5 py-2 text-sm font-bold capitalize transition ${billing === item ? 'bg-[#ae9bc9] text-[#08080F]' : 'text-[#9490B5] hover:text-white'}`}
              >
                {item === 'annual' ? 'Yearly -10%' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="businesses" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-1">
            <TabsTrigger value="businesses" className="rounded-xl">For Businesses</TabsTrigger>
            <TabsTrigger value="builders" className="rounded-xl">For Builders</TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {businessPlans.map((plan) => <PlanCard key={plan.title} plan={plan} billing={billing} />)}
            </div>
          </TabsContent>

          <TabsContent value="builders" className="mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {builderPlans.map((plan) => <PlanCard key={plan.title} plan={plan} billing={billing} />)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
