'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DashboardAgentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return router.push('/login');

      // Minimal agent fetch for owner-created agents
      const res = await supabase.from('agents').select('id, name, status').eq('owner_id', user.id).limit(20);
      setAgents(res.data || []);
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
              <h1 className="text-3xl font-bold">My Agents</h1>
              <p className="mt-2 text-sm text-[#A8B3CF] max-w-2xl">Manage your deployed agents and preview agent usage.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/studio" className="rounded-2xl bg-[#7C5CFF] px-5 py-3 text-sm font-semibold text-white">
                Open Studio
              </Link>
              <Link href="/dashboard" className="rounded-2xl border border-[#5B5EF7] px-5 py-3 text-sm font-semibold text-white">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 w-full animate-pulse rounded bg-[#0D1224]" />
                <div className="h-12 w-full animate-pulse rounded bg-[#0D1224]" />
              </div>
            ) : agents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#3B4A7F] bg-[#080B17] p-8 text-center">
                <p className="text-lg font-semibold">No agents yet</p>
                <p className="mt-2 text-sm text-[#A8B3CF]">Create new AI agents in the studio to automate workflows.</p>
                <div className="mt-4">
                  <Link href="/studio" className="rounded-2xl bg-[#5B5EF7] px-4 py-2 font-semibold">Create Agent</Link>
                </div>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {agents.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-2xl border border-[#1A1F2B] bg-[#0C1220] p-3">
                    <div className="font-medium">{a.name}</div>
                    <div className="text-sm text-[#A8B3CF]">{a.status}</div>
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
