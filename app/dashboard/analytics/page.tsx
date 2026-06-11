'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/login');
        return;
      }
      setLoading(false);
    };
    init();
  }, [router]);

  return (
    <main className="min-h-screen bg-page px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-[#1B2540] bg-[#111827] p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <p className="mt-2 text-sm text-[#A8B3CF] max-w-2xl">
                Insights into your builders, agents, deals and platform performance. Use these analytics to monitor growth and make data-driven decisions.
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="rounded-2xl bg-[#5B5EF7] px-5 py-3 text-sm font-semibold text-[#0B1020]">
                Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#1A1F2B] bg-[#0C1220] p-5">
              <div className="text-sm text-[#A8B3CF]">Total Agents</div>
              <div className="mt-3 text-3xl font-bold">—</div>
            </div>
            <div className="rounded-2xl border border-[#1A1F2B] bg-[#0C1220] p-5">
              <div className="text-sm text-[#A8B3CF]">Total Deals</div>
              <div className="mt-3 text-3xl font-bold">—</div>
            </div>
            <div className="rounded-2xl border border-[#1A1F2B] bg-[#0C1220] p-5">
              <div className="text-sm text-[#A8B3CF]">Revenue</div>
              <div className="mt-3 text-3xl font-bold">—</div>
            </div>
          </div>

          <div className="mt-6 text-sm text-[#A8B3CF]">
            These analytics are coming online — connect data sources or run the seed routes to populate sample metrics.
          </div>
        </section>
      </div>
    </main>
  );
}
