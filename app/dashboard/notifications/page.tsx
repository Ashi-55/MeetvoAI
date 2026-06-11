'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function DashboardNotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return router.push('/login');

      const res = await supabase.from('notifications').select('id, title, message, link, read, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
      setNotifications(res.data || []);
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
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="mt-2 text-sm text-[#A8B3CF]">Your recent notifications, including deal updates, messages and system alerts.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="rounded-2xl bg-[#5B5EF7] px-5 py-3 text-sm font-semibold text-[#0B1020]">Dashboard</Link>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <div className="space-y-3">
                <div className="h-12 w-full animate-pulse rounded bg-[#0D1224]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#3B4A7F] bg-[#080B17] p-8 text-center">
                <p className="text-lg font-semibold">No notifications</p>
                <p className="mt-2 text-sm text-[#A8B3CF]">You'll receive alerts about deals and messages here.</p>
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className={`flex items-start justify-between gap-4 rounded-2xl border border-[#1A1F2B] bg-[#0C1220] p-4`}>
                    <div>
                      <div className="font-semibold">{n.title}</div>
                      <div className="mt-1 text-xs text-[#A8B3CF]">{n.message}</div>
                      {n.link && (
                        <div className="mt-2">
                          <Link href={n.link} className="text-sm text-[#5B5EF7]">Open</Link>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-[#A8B3CF]">{new Date(n.created_at).toLocaleString()}</div>
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
