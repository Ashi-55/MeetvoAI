'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, LayoutGrid } from 'lucide-react';

export default function BuilderDashboardPage() {
  const router = useRouter();
  const { user, builderProfile } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!builderProfile) {
      router.push('/dashboard');
    }
  }, [builderProfile, router, user]);

  return (
    <main className="min-h-screen bg-[#0A0F1E] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 rounded-[32px] border border-[#1F2937] bg-[#0A0F1E] p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-[#8A9BB5]">Builder dashboard</p>
              <h1 className="mt-3 text-3xl font-bold">Welcome back, builder</h1>
              <p className="mt-2 text-sm text-[#8A9BB5]">Manage your agents, deploy previews, and publish to the marketplace.</p>
            </div>
            <Button onClick={() => router.push('/dashboard/builder/studio')} className="rounded-full bg-[#00C9A7] px-6 py-3 text-sm font-semibold text-[#0A0F1E]">
              ⚡ AI Studio
            </Button>
          </div>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-[28px] border border-[#1F2937] bg-[#09111F] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A0F1E] text-teal-400">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm text-[#8A9BB5]">AI Studio Access</p>
                <h2 className="mt-1 text-xl font-semibold">Build and publish agents</h2>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#8A9BB5]">Use AI to generate your next agent, test it in preview mode, and publish to the marketplace.</p>
          </Card>

          <Card className="rounded-[28px] border border-[#1F2937] bg-[#09111F] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A0F1E] text-[#8A9BB5]">
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-sm text-[#8A9BB5]">Quick access</p>
                <h2 className="mt-1 text-xl font-semibold">Agent management</h2>
              </div>
            </div>
            <p className="mt-4 text-sm text-[#8A9BB5]">Open the builder studio to create agent flows, publish to the marketplace, or deploy test previews.</p>
          </Card>
        </section>
      </div>
    </main>
  );
}
