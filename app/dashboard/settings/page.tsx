'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return router.push('/login');

      const res = await supabase.from('profiles').select('id, full_name, email, avatar_url').eq('id', user.id).single();
      setProfile(res.data || null);
      setLoading(false);
    };
    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-page px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-[#1E1B3A] bg-[#090C16] p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="mt-2 text-sm text-[#8A9BB5]">Update account details, billing preferences, and connected integrations.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="rounded-2xl bg-[#4F8EF7] px-5 py-3 text-sm font-semibold text-[#08080F]">Dashboard</Link>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 w-full animate-pulse rounded bg-[#0D1224]" />
              </div>
            ) : (
              <div className="rounded-2xl border border-[#1A1F2B] bg-[#0C1220] p-6">
                <div className="text-sm text-[#8A9BB5]">Account</div>
                <div className="mt-3 font-semibold text-white">{profile?.full_name || 'Unknown'}</div>
                <div className="mt-1 text-xs text-[#8A9BB5]">{profile?.email || ''}</div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link href="/settings" className="rounded-2xl border border-[#4F8EF7] px-4 py-2 text-sm font-semibold text-white">Edit Profile</Link>
                  <Link href="/pricing" className="rounded-2xl bg-[#4F8EF7] px-4 py-2 text-sm font-semibold text-[#08080F]">Manage Subscription</Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
