'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Shield, Check, TriangleAlert as AlertTriangle, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RatingStars } from '@/components/ui/rating-stars';
import type { Order } from '@/types';

const disputeSchema = z.object({ reason: z.string().min(50, 'Describe the issue in at least 50 characters') });
const reviewSchema = z.object({ rating: z.coerce.number().min(1).max(5), title: z.string().optional(), content: z.string().optional() });

type DisputeData = z.infer<typeof disputeSchema>;
type ReviewData = z.infer<typeof reviewSchema>;

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-amber/20 text-amber',
  active: 'bg-blue/20 text-blue',
  submitted: 'bg-brand/20 text-brand',
  approved: 'bg-green/20 text-green',
  completed: 'bg-green/20 text-green',
  disputed: 'bg-red/20 text-red',
  cancelled: 'bg-text3/20 text-text3',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'buying' | 'selling'>('buying');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [submitModalOrderId, setSubmitModalOrderId] = useState<string | null>(null);
  const [submitNotes, setSubmitNotes] = useState('');

  const disputeForm = useForm<DisputeData>({ resolver: zodResolver(disputeSchema) });
  const reviewForm = useForm<ReviewData>({ resolver: zodResolver(reviewSchema), defaultValues: { rating: 5 } });

  useEffect(() => {
    if (!user) return;
    loadOrders();
  }, [user, tab]);

  async function loadOrders() {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from('orders').select('*, buyer:profiles!orders_buyer_id_fkey(full_name, email), builder:profiles!orders_builder_id_fkey(full_name), agent:agents(name), buyer_profile:buyer_profiles(business_name), builder_profile:builder_profiles(verification_status)');
    if (tab === 'buying') q = q.eq('buyer_id', user!.id);
    else q = q.eq('builder_id', user!.id);
    const { data } = await q.order('created_at', { ascending: false });
    setOrders((data || []) as unknown as Order[]);
    setLoading(false);
  }

  async function approveWork(orderId: string) {
    setActionLoading(orderId);
    await fetch(`/api/orders/${orderId}/approve`, { method: 'POST' });
    await loadOrders();
    setActionLoading(null);
  }

  async function submitDispute(data: DisputeData) {
    if (!disputeOrderId) return;
    setActionLoading(disputeOrderId);
    await fetch(`/api/orders/${disputeOrderId}/dispute`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: data.reason }),
    });
    setDisputeOrderId(null);
    await loadOrders();
    setActionLoading(null);
  }

  async function submitWork(orderId: string) {
    setActionLoading(orderId);
    await fetch(`/api/orders/${orderId}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: submitNotes }) });
    setSubmitModalOrderId(null);
    await loadOrders();
    setActionLoading(null);
  }

  async function submitReview(data: ReviewData) {
    if (!reviewOrderId) return;
    const order = orders.find((o) => o.id === reviewOrderId);
    if (!order) return;
    const supabase = createClient();
    await supabase.from('reviews').insert({
      order_id: reviewOrderId,
      reviewer_id: user!.id,
      builder_id: order.builder_id,
      agent_id: order.agent_id,
      rating: data.rating,
      title: data.title || null,
      content: data.content || null,
    });
    setReviewOrderId(null);
  }

  const STEPS = ['Payment', 'Active', 'Submitted', 'Approved', 'Completed'];
  function getStepIndex(status: string) {
    const map: Record<string, number> = { pending_payment: 0, active: 1, submitted: 2, approved: 3, completed: 4 };
    return map[status] ?? 0;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-6">Orders</h1>

      <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border w-fit mb-6">
        {(['buying', 'selling'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-brand text-white' : 'text-text2 hover:text-text'}`}>
            {t === 'buying' ? 'Buying' : 'Selling'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 bg-surface rounded-xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-xl border border-border text-text3">
          <Shield size={40} className="mx-auto mb-4 opacity-30" />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const counterpart = tab === 'buying'
              ? (order as unknown as Record<string, Record<string, string>>).builder?.full_name
              : ((order as unknown as Record<string, Record<string, string>>).buyer_profile?.business_name || (order as unknown as Record<string, Record<string, string>>).buyer?.full_name);
            const stepIdx = getStepIndex(order.order_status ?? '');

            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-text">{order.title}</h3>
                    <p className="text-text3 text-sm mt-0.5">{tab === 'buying' ? 'Builder' : 'Buyer'}: {counterpart}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-brand font-bold">₹{(order.total_amount ?? 0).toLocaleString('en-IN')}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.order_status ?? ''] || 'bg-surface3 text-text3'}`}>
                      {(order.order_status ?? '').replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                  </div>
                </div>

                {['pending_payment', 'active', 'submitted', 'approved', 'completed'].includes(order.order_status ?? '') && (
                  <div className="flex items-center gap-1 mb-4 overflow-x-auto">
                    {STEPS.map((step, i) => (
                      <div key={step} className="flex items-center gap-1 shrink-0">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= stepIdx ? 'bg-brand text-white' : 'bg-surface3 text-text3'}`}>
                          {i < stepIdx ? <Check size={11} /> : i + 1}
                        </div>
                        <span className={`text-xs whitespace-nowrap ${i <= stepIdx ? 'text-text2' : 'text-text3'}`}>{step}</span>
                        {i < STEPS.length - 1 && <div className={`h-0.5 w-6 transition-colors ${i < stepIdx ? 'bg-brand' : 'bg-surface3'}`} />}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {tab === 'buying' && order.order_status === 'submitted' && (
                    <>
                      <button onClick={() => approveWork(order.id)} disabled={actionLoading === order.id}
                        className="bg-green/20 hover:bg-green/30 border border-green/40 text-green rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50">
                        <Check size={14} /> Approve Work
                      </button>
                      <button onClick={() => setDisputeOrderId(order.id)}
                        className="bg-red/10 hover:bg-red/20 border border-red/30 text-red rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Raise Dispute
                      </button>
                    </>
                  )}
                  {tab === 'buying' && order.order_status === 'completed' && (
                    <button onClick={() => setReviewOrderId(order.id)}
                      className="bg-amber/10 hover:bg-amber/20 border border-amber/30 text-amber rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center gap-1.5">
                      <Star size={14} /> Leave Review
                    </button>
                  )}
                  {tab === 'selling' && order.order_status === 'active' && (
                    <button onClick={() => setSubmitModalOrderId(order.id)}
                      className="bg-brand/20 hover:bg-brand/30 border border-brand/40 text-brand rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                      Submit Work
                    </button>
                  )}
                  {order.order_status === 'disputed' && (
                    <span className="text-red text-sm">Dispute under review. Admin will resolve within 72 hours.</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {disputeOrderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setDisputeOrderId(null)}>
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text mb-2">Raise Dispute</h2>
            <p className="text-text3 text-sm mb-4">Describe the issue clearly. Admin will review within 72 hours.</p>
            <form onSubmit={disputeForm.handleSubmit(submitDispute)}>
              <textarea {...disputeForm.register('reason')} rows={4} placeholder="Describe the issue (min 50 characters)..."
                className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors resize-none mb-1" />
              {disputeForm.formState.errors.reason && <p className="text-red text-xs mb-3">{disputeForm.formState.errors.reason.message}</p>}
              <div className="flex gap-3 mt-3">
                <button type="button" onClick={() => setDisputeOrderId(null)} className="flex-1 bg-surface2 border border-border text-text rounded-lg py-2.5 font-medium transition-colors hover:bg-surface3">Cancel</button>
                <button type="submit" disabled={!!actionLoading} className="flex-1 bg-red/20 hover:bg-red/30 border border-red/40 text-red rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {submitModalOrderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSubmitModalOrderId(null)}>
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text mb-4">Submit Work</h2>
            <textarea value={submitNotes} onChange={(e) => setSubmitNotes(e.target.value)} rows={3} placeholder="Describe what you've delivered..."
              className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setSubmitModalOrderId(null)} className="flex-1 bg-surface2 border border-border text-text rounded-lg py-2.5 font-medium transition-colors hover:bg-surface3">Cancel</button>
              <button onClick={() => submitWork(submitModalOrderId)} disabled={!!actionLoading}
                className="flex-1 bg-brand hover:bg-brand2 text-white rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewOrderId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setReviewOrderId(null)}>
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-text mb-4">Leave a Review</h2>
            <form onSubmit={reviewForm.handleSubmit(submitReview)} className="space-y-4">
              <div>
                <label className="block text-sm text-text2 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button key={r} type="button" onClick={() => reviewForm.setValue('rating', r)}
                      className={`w-10 h-10 rounded-lg border transition-colors flex items-center justify-center ${reviewForm.watch('rating') >= r ? 'bg-amber/20 border-amber text-amber' : 'bg-surface2 border-border text-text3'}`}>
                      <Star size={16} className={reviewForm.watch('rating') >= r ? 'fill-amber' : ''} />
                    </button>
                  ))}
                </div>
              </div>
              <input {...reviewForm.register('title')} placeholder="Review title (optional)"
                className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
              <textarea {...reviewForm.register('content')} rows={3} placeholder="Describe your experience..."
                className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors resize-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setReviewOrderId(null)} className="flex-1 bg-surface2 border border-border text-text rounded-lg py-2.5 font-medium hover:bg-surface3 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 bg-brand hover:bg-brand2 text-white rounded-lg py-2.5 font-medium transition-colors">Submit Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
