'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Handshake, MessageSquare, Search } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  role: 'business' | 'builder';
  avatar_url?: string;
}

interface Deal {
  id: string;
  business_id: string;
  builder_id: string;
  project_name: string;
  amount: number;
  status: 'payment_pending' | 'in_progress' | 'submitted' | 'completed';
  conversation_id: string;
  partner?: Profile;
  isBuyer?: boolean;
}

const statusStyles: Record<string, string> = {
  payment_pending: 'bg-[#F6AD5540] text-[#F6AD55]',
  in_progress: 'bg-[#5B5EF740] text-[#5B5EF7]',
  submitted: 'bg-[#A78BFA30] text-[#A78BFA]',
  completed: 'bg-[#22C55E20] text-[#48BB78]',
};

export default function DashboardDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        const profileRes = await supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (profileRes.error || !profileRes.data) {
          setError('Unable to load your profile.');
          return;
        }

        setProfile(profileRes.data);

        const dealsRes = await supabase
          .from('deals')
          .select('id, business_id, builder_id, project_name, amount, status, conversation_id')
          .or(`business_id.eq.${user.id},builder_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (dealsRes.error) {
          setError('Unable to load deals.');
          return;
        }

        const rawDeals = dealsRes.data || [];
        const partnerIds = Array.from(
          new Set(
            rawDeals.flatMap((deal: Deal) => [deal.business_id, deal.builder_id])
          )
        ).filter((id) => id !== user.id);

        const profilesRes = await supabase
          .from('profiles')
          .select('id, full_name, role, avatar_url')
          .in('id', partnerIds.length ? partnerIds : ['']);

        const profileMap = new Map<string, Profile>();
        (profilesRes.data || []).forEach((profile: Profile) => {
          profileMap.set(profile.id, profile as Profile);
        });

        const mappedDeals = rawDeals.map((deal: Deal) => ({
          ...deal,
          partner: profileMap.get(deal.business_id === user.id ? deal.builder_id : deal.business_id),
          isBuyer: deal.business_id === user.id,
        }));

        setDeals(mappedDeals as Deal[]);
      } catch (err) {
        setError('Something went wrong while loading deals.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [router]);

  const activeDeals = deals.filter((deal) => deal.status !== 'completed');
  const completedDeals = deals.filter((deal) => deal.status === 'completed');

  return (
    <main className="min-h-screen bg-page px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-[#1B2540] bg-[#111827] p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">My Deals</h1>
              <p className="mt-2 max-w-2xl text-sm text-[#A8B3CF]">
                View your active projects, payments, and ongoing conversations with builders or buyers.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#5B5EF7] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#3C73D8]"
              >
                <ArrowLeft size={16} />
                Back to Dashboard
              </button>
              <Link
                href="/messages"
                className="inline-flex items-center gap-2 rounded-2xl border border-[#5B5EF7] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00C2A8] hover:text-[#00C2A8]"
              >
                <MessageSquare size={16} />
                Open Conversations
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-[#1A1F2B] bg-[#0C1220] p-5">
              <div className="text-sm text-[#A8B3CF]">Total Deals</div>
              <div className="mt-3 text-3xl font-bold">{deals.length}</div>
            </div>
            <div className="rounded-3xl border border-[#1A1F2B] bg-[#0C1220] p-5">
              <div className="text-sm text-[#A8B3CF]">Active Deals</div>
              <div className="mt-3 text-3xl font-bold">{activeDeals.length}</div>
            </div>
            <div className="rounded-3xl border border-[#1A1F2B] bg-[#0C1220] p-5">
              <div className="text-sm text-[#A8B3CF]">Completed Deals</div>
              <div className="mt-3 text-3xl font-bold">{completedDeals.length}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-[#1B2540] bg-[#111827] p-6 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Deal details</h2>
              <p className="mt-1 text-sm text-[#A8B3CF]">
                Browse every deal with partner, amount, status, and quick chat access.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-8 space-y-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="h-24 rounded-3xl bg-[#0D1224] p-4 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-8 rounded-3xl border border-[#5B5EF7] bg-[#081127] p-6 text-sm text-[#F8FAFC]">
              {error}
            </div>
          ) : deals.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-[#3B4A7F] bg-[#080B17] p-10 text-center">
              <Handshake size={40} className="mx-auto text-[#5B5EF7]" />
              <p className="mt-5 text-lg font-semibold">No deals found yet</p>
              <p className="mt-2 text-sm text-[#A8B3CF]">
                Start by browsing builders or creating a new project in the marketplace.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/marketplace"
                  className="rounded-2xl bg-[#5B5EF7] px-5 py-3 text-sm font-semibold text-[#0B1020]"
                >
                  Browse Marketplace
                </Link>
                <Link
                  href="/messages"
                  className="rounded-2xl border border-[#5B5EF7] px-5 py-3 text-sm font-semibold text-white"
                >
                  View Conversations
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-[#1A1F2B] bg-[#0C1220]">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-[#1A1F2B] bg-[#0A101E] text-[#A8B3CF]">
                  <tr>
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">Partner</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal) => (
                    <tr key={deal.id} className="border-b border-[#161C2D] last:border-none">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{deal.project_name}</div>
                        <div className="mt-1 text-xs text-[#A8B3CF]">
                          {deal.isBuyer ? 'Buyer' : 'Builder'} role
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">
                          {deal.partner?.full_name || 'Unknown partner'}
                        </div>
                        <div className="mt-1 text-xs text-[#A8B3CF]">
                          {deal.partner?.role === 'builder' ? 'Builder' : 'Business'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-white">₹{deal.amount.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[deal.status] || 'bg-[#1B2540] text-[#A8B3CF]'}`}>
                          {deal.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => router.push(`/messages?conversation=${deal.conversation_id}`)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-[#5B5EF7] bg-transparent px-4 py-2 text-sm font-semibold text-[#5B5EF7] transition hover:bg-[#5B5EF7]/10"
                        >
                          <MessageSquare size={14} />
                          Chat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

