'use client';

import { useState, useEffect } from 'react';
import { Check, X, Shield, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { Profile, BuilderProfile, Order } from '@/types';

export default function AdminPage() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'verification' | 'disputes' | 'stats'>('verification');
  const [pendingBuilders, setPendingBuilders] = useState<Array<{ profile: Profile; builderProfile: BuilderProfile }>>([]);
  const [disputedOrders, setDisputedOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ gmv: 0, fees: 0, activeOrders: 0, totalBuilders: 0 });
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');
  const [selectedBuilderId, setSelectedBuilderId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && profile && !(profile as any).is_admin) router.push('/');
  }, [profile, isLoading]);

  useEffect(() => {
    if ((profile as any)?.is_admin) loadData();
  }, [profile]);

  async function loadData() {
    const supabase = createClient();
    const [{ data: pb }, { data: do_ }, { data: os }] = await Promise.all([
      supabase.from('profiles').select('*, builder_profiles(*)').eq('builder_profiles.verification_status', 'pending_verification').not('builder_profiles', 'is', null),
      supabase.from('orders').select('*, buyer:profiles!orders_buyer_id_fkey(full_name), builder:profiles!orders_builder_id_fkey(full_name)').eq('order_status', 'disputed'),
      supabase.from('orders').select('total_amount, platform_fee, order_status'),
    ]);

    setPendingBuilders((pb || []).filter((b: Record<string, unknown>) => b.builder_profiles).map((b: Record<string, unknown>) => ({ profile: b as unknown as Profile, builderProfile: (b as Record<string, unknown>).builder_profiles as unknown as BuilderProfile })));
    setDisputedOrders((do_ || []) as unknown as Order[]);
    if (os) {
      const completed = os.filter((o: Record<string, unknown>) => o.order_status === 'completed' || o.order_status === 'active');
      setStats({
        gmv: completed.reduce((s: number, o: Record<string, unknown>) => s + (o.total_amount as number), 0),
        fees: completed.reduce((s: number, o: Record<string, unknown>) => s + (o.platform_fee as number), 0),
        activeOrders: os.filter((o: Record<string, unknown>) => o.order_status === 'active').length,
        totalBuilders: pendingBuilders.length,
      });
    }
  }

  async function verifyBuilder(id: string, action: 'verified' | 'rejected', notes: string) {
    setLoading(true);
    const supabase = createClient();
    await supabase.from('builder_profiles').update({ verification_status: action, verification_notes: notes }).eq('id', id);
    if (action === 'verified') {
      await supabase.from('builder_profiles').update({ show_on_hire_page: true }).eq('id', id);
    }
    await loadData();
    setSelectedBuilderId(null);
    setLoading(false);
  }

  async function resolveDispute(orderId: string, action: 'released' | 'refunded') {
    setLoading(true);
    const supabase = createClient();
    await supabase.from('orders').update({
      escrow_status: action,
      order_status: action === 'released' ? 'completed' : 'cancelled',
      admin_notes: adminNotes[orderId] || null,
    }).eq('id', orderId);
    await loadData();
    setLoading(false);
  }

  if (isLoading) return <div className="flex items-center justify-center h-screen text-text3">Loading...</div>;
  if (!(profile as any)?.is_admin) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-brand" />
        <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
      </div>

      <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border w-fit mb-8">
        {(['verification', 'disputes', 'stats'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-brand text-white' : 'text-text2 hover:text-text'}`}>
            {t === 'verification' ? `Verification (${pendingBuilders.length})` : t === 'disputes' ? `Disputes (${disputedOrders.length})` : 'Stats'}
          </button>
        ))}
      </div>

      {tab === 'verification' && (
        <div className="space-y-4">
          {pendingBuilders.length === 0 && <p className="text-text3 text-center py-12">No pending verifications</p>}
          {pendingBuilders.map(({ profile: bp, builderProfile: bl }) => (
            <div key={bp.id} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-text">{bp.full_name}</h3>
                  <p className="text-text3 text-sm">{bp.email}</p>
                  <p className="text-text2 text-sm mt-1">{bl.title}</p>
                  {bl.linkedin_url && <a href={bl.linkedin_url} target="_blank" className="text-brand text-sm hover:underline">LinkedIn Profile</a>}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(bl.specialties || []).slice(0, 4).map((s) => <span key={s} className="bg-surface2 text-text3 px-2 py-0.5 rounded text-xs">{s}</span>)}
                  </div>
                  <p className="text-text3 text-xs mt-2">{bl.experience_years ?? 0} years experience</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setSelectedBuilderId(bp.id as string); }}
                    className="bg-green/20 hover:bg-green/30 border border-green/40 text-green rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1 transition-colors">
                    <Check size={14} /> Review
                  </button>
                </div>
              </div>
              {selectedBuilderId === bp.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <textarea value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} rows={2} placeholder="Verification notes (optional)..."
                    className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-3 py-2 text-text text-sm placeholder-text3 outline-none resize-none" />
                  <div className="flex gap-2">
                    <button onClick={() => verifyBuilder(bp.id as string, 'verified', verifyNotes)} disabled={loading}
                      className="bg-green/20 hover:bg-green/30 border border-green/40 text-green rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50">
                      <Check size={14} /> Verify Builder
                    </button>
                    <button onClick={() => verifyBuilder(bp.id as string, 'rejected', verifyNotes)} disabled={loading}
                      className="bg-red/10 hover:bg-red/20 border border-red/30 text-red rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50">
                      <X size={14} /> Reject
                    </button>
                    <button onClick={() => setSelectedBuilderId(null)} className="bg-surface2 border border-border text-text2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-surface3">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'disputes' && (
        <div className="space-y-4">
          {disputedOrders.length === 0 && <p className="text-text3 text-center py-12">No active disputes</p>}
          {disputedOrders.map((order) => (
            <div key={order.id} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-semibold text-text">{order.title}</h3>
                  <p className="text-text3 text-sm">Buyer: {(order as unknown as Record<string, Record<string, string>>).buyer?.full_name} · Builder: {(order as unknown as Record<string, Record<string, string>>).builder?.full_name}</p>
                  <p className="text-brand font-semibold mt-1">₹{(order.total_amount ?? 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
              {order.dispute_reason && (
                <div className="bg-red/5 border border-red/20 rounded-lg p-3 mb-3">
                  <p className="text-text3 text-xs font-semibold mb-1">DISPUTE REASON</p>
                  <p className="text-text2 text-sm">{order.dispute_reason}</p>
                </div>
              )}
              <textarea value={adminNotes[order.id] || ''} onChange={(e) => setAdminNotes((n) => ({ ...n, [order.id]: e.target.value }))} rows={2}
                placeholder="Admin resolution notes..."
                className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-3 py-2 text-text text-sm placeholder-text3 outline-none resize-none mb-3" />
              <div className="flex gap-2">
                <button onClick={() => resolveDispute(order.id, 'released')} disabled={loading}
                  className="flex-1 bg-green/20 hover:bg-green/30 border border-green/40 text-green rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
                  Release to Builder
                </button>
                <button onClick={() => resolveDispute(order.id, 'refunded')} disabled={loading}
                  className="flex-1 bg-red/10 hover:bg-red/20 border border-red/30 text-red rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50">
                  Refund to Buyer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'stats' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: 'Total GMV', value: `₹${stats.gmv.toLocaleString('en-IN')}`, icon: <DollarSign size={20} /> },
            { label: 'Platform Fees', value: `₹${stats.fees.toLocaleString('en-IN')}`, icon: <Shield size={20} /> },
            { label: 'Active Orders', value: stats.activeOrders, icon: <Check size={20} /> },
            { label: 'Pending Verifications', value: pendingBuilders.length, icon: <Shield size={20} /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-surface border border-border rounded-xl p-5 text-center">
              <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mx-auto mb-3">{icon}</div>
              <p className="text-2xl font-bold text-text">{value}</p>
              <p className="text-text3 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
