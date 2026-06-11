'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DashboardDeployedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deployed, setDeployed] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return router.push('/login');

      const res = await supabase.from('agents').select('id, name, status, url').eq('owner_id', user.id).limit(50);
      setDeployed(res.data || []);
      setLoading(false);
    };
    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-page px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-[#1B2540] bg-[#111827] p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Deployed Agents</h1>
              <p className="mt-2 text-sm text-[#A8B3CF] max-w-2xl">List of agents you've deployed with quick access to previews and stats.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/studio" className="rounded-2xl bg-[#7C5CFF] px-5 py-3 text-sm font-semibold text-white">Open Studio</Link>
              <Link href="/dashboard/agents" className="rounded-2xl border border-[#5B5EF7] px-5 py-3 text-sm font-semibold text-white">My Agents</Link>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 w-full animate-pulse rounded bg-[#0D1224]" />
              </div>
            ) : deployed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#3B4A7F] bg-[#080B17] p-8 text-center">
                <p className="text-lg font-semibold">No deployed agents</p>
                <p className="mt-2 text-sm text-[#A8B3CF]">Deploy an agent from the studio to make it available externally.</p>
                <div className="mt-4">
                  <Link href="/studio" className="rounded-2xl bg-[#5B5EF7] px-4 py-2 font-semibold">Deploy Agent</Link>
                </div>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {deployed.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-2xl border border-[#1A1F2B] bg-[#0C1220] p-3">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-[#A8B3CF]">{d.url || 'No public URL'}</div>
                    </div>
                    <div className="text-sm text-[#A8B3CF]">{d.status}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
