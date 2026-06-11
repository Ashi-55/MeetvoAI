'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, BadgeCheck, Check, DollarSign, RefreshCw, ShieldAlert, TrendingUp, Users, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBuilders: 0,
    totalBuyers: 0,
    totalPayments: 0,
    closedDeals: 0,
    activeDeals: 0,
    totalGMV: 0,
    platformFees: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && profile && !(profile as any).is_admin) router.push('/');
  }, [profile, isLoading, router]);

  useEffect(() => {
    if ((profile as any)?.is_admin) loadStats();
  }, [profile]);

  async function loadStats() {
    setLoading(true);
    const supabase = createClient();
    try {
      const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const { count: totalBuilders } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('current_mode', 'builder');
      const { count: totalBuyers } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('current_mode', 'buyer');
      const { data: completedDeals } = await supabase.from('orders').select('total_amount, platform_fee').eq('order_status', 'completed');
      const { count: activeDeals } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'active');

      setStats({
        totalUsers: totalUsers || 0,
        totalBuilders: totalBuilders || 0,
        totalBuyers: totalBuyers || 0,
        totalPayments: completedDeals?.length || 0,
        closedDeals: completedDeals?.length || 0,
        activeDeals: activeDeals || 0,
        totalGMV: completedDeals?.reduce((sum: number, d: any) => sum + (d.total_amount || 0), 0) || 0,
        platformFees: completedDeals?.reduce((sum: number, d: any) => sum + (d.platform_fee || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#0B1020] text-[#A8B3CF]">Loading admin console...</div>;
  if (!(profile as any)?.is_admin) return null;

  return (
    <main className="premium-shell min-h-screen px-4 py-10 text-white lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#00C2A8]">Operations Console</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white">Admin command center</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#A8B3CF]">
              Monitor marketplace health, payments, builder approvals, disputes, moderation, and platform risk.
            </p>
          </div>
          <button
            onClick={() => { setLoading(true); loadStats(); }}
            className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[#5B5EF7] px-5 py-3 text-sm font-black text-white transition hover:bg-[#4B4EE8]"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Stats
          </button>
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={<Users size={20} />} tone="blue" />
          <StatCard label="Builders" value={stats.totalBuilders} icon={<Zap size={20} />} tone="teal" />
          <StatCard label="Buyers" value={stats.totalBuyers} icon={<Users size={20} />} tone="blue" />
          <StatCard label="Closed Deals" value={stats.closedDeals} icon={<Check size={20} />} tone="green" />
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active Deals" value={stats.activeDeals} icon={<TrendingUp size={20} />} tone="amber" />
          <StatCard label="Payments" value={stats.totalPayments} icon={<DollarSign size={20} />} tone="green" />
          <StatCard label="GMV" value={`₹${stats.totalGMV.toLocaleString('en-IN')}`} icon={<DollarSign size={20} />} tone="blue" />
          <StatCard label="Platform Fees" value={`₹${stats.platformFees.toLocaleString('en-IN')}`} icon={<DollarSign size={20} />} tone="teal" />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="premium-card rounded-[24px] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Operational queues</h2>
                <p className="mt-1 text-sm text-[#A8B3CF]">What admins should review before it becomes a customer issue.</p>
              </div>
              <BadgeCheck className="text-[#00C2A8]" size={24} />
            </div>
            <div className="space-y-3">
              {[
                ['Builder approvals', 'Verify identity, portfolio quality, language support, and response SLA.', '12 pending'],
                ['Escrow disputes', 'Review submitted proof, buyer feedback, and payout eligibility.', '3 active'],
                ['Content moderation', 'Scan marketplace cards, external payment attempts, and unsafe promises.', '8 flags'],
                ['Payment reconciliation', 'Match Razorpay captures, refunds, failed payments, and order status.', 'Live'],
              ].map(([title, body, meta]) => (
                <div key={title} className="rounded-[18px] border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-white">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#A8B3CF]">{body}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-[#111827] px-3 py-1 text-xs font-bold text-[#A8B3CF]">{meta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="premium-card rounded-[24px] p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black text-white">Risk monitor</h2>
              <p className="mt-1 text-sm text-[#A8B3CF]">Fraud and trust signals for a healthier marketplace.</p>
            </div>
            <div className="space-y-4">
              {[
                [ShieldAlert, 'External payment attempts', 'Auto-detect direct payment language in chat.', '#EF4444'],
                [AlertTriangle, 'Delayed deliveries', 'Surface projects approaching due date.', '#F59E0B'],
                [BadgeCheck, 'Verified supply', 'Prioritize high-quality builders in search.', '#00C2A8'],
              ].map(([Icon, title, body, color]) => {
                const RiskIcon = Icon as typeof ShieldAlert;
                return (
                  <div key={title as string} className="rounded-[18px] border border-white/10 bg-[#0B1020]/62 p-4">
                    <RiskIcon size={22} style={{ color: color as string }} />
                    <p className="mt-3 font-black text-white">{title as string}</p>
                    <p className="mt-1 text-sm leading-6 text-[#A8B3CF]">{body as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {loading && (
          <div className="mt-8 rounded-[20px] border border-white/10 bg-white/[0.035] p-8 text-center text-[#A8B3CF]">
            Loading platform statistics...
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: string | number; icon: React.ReactNode; tone: 'blue' | 'teal' | 'green' | 'amber' }) {
  const color = tone === 'teal' ? '#00C2A8' : tone === 'green' ? '#22C55E' : tone === 'amber' ? '#F59E0B' : '#5B5EF7';
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_54px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#A8B3CF]">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-[16px]" style={{ background: `${color}1A`, color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
