'use client';

import { useState, useEffect } from 'react';
import { Check, DollarSign, Users, Zap, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/types';

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
  }, [profile, isLoading]);

  useEffect(() => {
    if ((profile as any)?.is_admin) loadStats();
  }, [profile]);

  async function loadStats() {
    setLoading(true);
    const supabase = createClient();

    try {
      // Total users
      const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact', head: true });

      // Builders
      const { count: totalBuilders } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('current_mode', 'builder');

      // Buyers
      const { count: totalBuyers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('current_mode', 'buyer');

      // Completed deals (orders with completed status)
      const { data: completedDeals } = await supabase
        .from('orders')
        .select('total_amount, platform_fee')
        .eq('order_status', 'completed');

      // Active deals
      const { count: activeDeals } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('order_status', 'active');

      const closedDealsCount = completedDeals?.length || 0;
      const totalPayments = completedDeals?.length || 0;
      const totalGMV = completedDeals?.reduce((sum: number, d: any) => sum + (d.total_amount || 0), 0) || 0;
      const platformFees = completedDeals?.reduce((sum: number, d: any) => sum + (d.platform_fee || 0), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        totalBuilders: totalBuilders || 0,
        totalBuyers: totalBuyers || 0,
        totalPayments,
        closedDeals: closedDealsCount,
        activeDeals: activeDeals || 0,
        totalGMV,
        platformFees,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen text-text3">Loading...</div>;
  if (!(profile as any)?.is_admin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text mb-2">Admin Dashboard</h1>
        <p className="text-text3">Platform overview and statistics</p>
      </div>

      <button onClick={() => { setLoading(true); loadStats(); }}
        className="mb-6 bg-brand hover:bg-brand2 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
        Refresh Stats
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Total Users" value={stats.totalUsers} icon={<Users size={20} />} />
        <StatCard label="Total Builders" value={stats.totalBuilders} icon={<Zap size={20} />} />
        <StatCard label="Total Buyers" value={stats.totalBuyers} icon={<Users size={20} />} />
        <StatCard label="Closed Deals" value={stats.closedDeals} icon={<Check size={20} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
        <StatCard label="Active Deals" value={stats.activeDeals} icon={<TrendingUp size={20} />} />
        <StatCard label="Total Payments" value={stats.totalPayments} icon={<DollarSign size={20} />} />
        <StatCard label="Total GMV" value={`₹${stats.totalGMV.toLocaleString('en-IN')}`} icon={<DollarSign size={20} />} />
        <StatCard label="Platform Fees" value={`₹${stats.platformFees.toLocaleString('en-IN')}`} icon={<DollarSign size={20} />} />
      </div>

      {loading && (
        <div className="mt-8 flex items-center justify-center p-8 bg-surface border border-border rounded-xl">
          <p className="text-text3">Loading statistics...</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text3 text-sm mb-1">{label}</p>
          <p className="text-2xl font-bold text-text">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-brand/10 text-brand flex items-center justify-center">{icon}</div>
      </div>
    </div>
  );
}
