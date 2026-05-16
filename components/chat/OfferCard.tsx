'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculatePlatformFee } from '@/lib/fees';
import type { Message } from '@/types';

interface Props {
  message: Message;
  isMine: boolean;
  conversationId: string;
}

export function OfferCard({ message, isMine, conversationId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const offer = message.offer_data!;
  const { platformFee, gst, total } = calculatePlatformFee(offer.price ?? 0);

  async function acceptOffer() {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();
    const { data: conv } = await supabase.from('conversations').select('buyer_id, builder_id').eq('id', conversationId).single();
    if (!conv) { setLoading(false); return; }
    const { data: order } = await supabase.from('orders').insert({
      buyer_id: conv.buyer_id,
      builder_id: conv.builder_id,
      conversation_id: conversationId,
      title: offer.description,
      description: offer.description,
      deal_value: offer.price,
      platform_fee: platformFee,
      gst_amount: gst,
      total_amount: total,
      delivery_days: offer.delivery_days,
      order_status: 'pending_payment',
    }).select('id').single();
    if (order) {
      await supabase.from('messages').update({ offer_data: { ...offer, status: 'accepted', order_id: order.id } }).eq('id', message.id);
      router.push(`/checkout/${order.id}`);
    }
    setLoading(false);
  }

  async function declineOffer() {
    const supabase = createClient();
    await supabase.from('messages').update({ offer_data: { ...offer, status: 'declined' } }).eq('id', message.id);
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%] bg-surface2 border border-border rounded-xl overflow-hidden">
        <div className="bg-brand/10 border-b border-border px-3 py-2 flex items-center gap-2">
          <ClipboardList size={14} className="text-brand" />
          <span className="text-text font-semibold text-sm">Service Offer</span>
        </div>
        <div className="p-3 space-y-2">
          <p className="text-text text-sm leading-snug">{offer.description}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-text2"><span>Price</span><span className="text-text font-medium">₹{(offer.price ?? 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-text2"><span>Delivery</span><span className="text-text font-medium">{offer.delivery_days ?? 0} days</span></div>
            <div className="flex justify-between text-text3"><span>Platform fee (5%)</span><span>₹{platformFee.toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-text3"><span>GST (18% on fee)</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
            <div className="h-px bg-border my-1" />
            <div className="flex justify-between font-semibold"><span className="text-text">Total</span><span className="text-brand">₹{total.toLocaleString('en-IN')}</span></div>
          </div>
          {offer.status === 'pending' && !isMine && (
            <div className="flex gap-2 pt-1">
              <button onClick={acceptOffer} disabled={loading}
                className="flex-1 bg-green/20 hover:bg-green/30 border border-green/40 text-green rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
                <Check size={12} /> Accept & Pay
              </button>
              <button onClick={declineOffer}
                className="flex-1 bg-surface3 hover:bg-surface border border-border text-text2 rounded-lg py-1.5 text-xs flex items-center justify-center gap-1 transition-colors">
                <X size={12} /> Decline
              </button>
            </div>
          )}
          {offer.status === 'accepted' && <p className="text-green text-xs font-semibold text-center pt-1">✓ Offer Accepted</p>}
          {offer.status === 'declined' && <p className="text-text3 text-xs text-center pt-1">Offer Declined</p>}
        </div>
      </div>
    </div>
  );
}
