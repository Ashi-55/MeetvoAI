'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, BadgeCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { calculatePlatformFee } from '@/lib/fees';
import type { Order } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const schema = z.object({
  requirements: z.string().min(10, 'Describe your requirements (min 10 chars)'),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.from('orders').select('*, buyer:profiles!orders_buyer_id_fkey(full_name, email), builder:profiles!orders_builder_id_fkey(full_name), agent:agents(name), buyer_profile:buyer_profiles(business_name), builder_profile:builder_profiles(verification_status)').eq('id', id).maybeSingle();
      if (data) setOrder(data as unknown as Order);
      setLoading(false);
    }
    load();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
  }, [id]);

  async function onSubmit(data: FormData) {
    if (!order || !user || !profile) return;
    setPaying(true);
    try {
      const amount = order.total_amount ?? 0;
      const res = await fetch('/api/orders/create-razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, amount, requirements: data.requirements }),
      });
      const { razorpayOrderId, key } = await res.json();

      const rzp = new window.Razorpay({
        key,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'MeetvoAI',
        description: order.title,
        order_id: razorpayOrderId,
        prefill: {
          name: profile.full_name,
          email: profile.email,
        },
        theme: { color: '#6C3AFF' },
        handler: async (response: Record<string, string>) => {
          await fetch(`/api/orders/${id}/payment-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ razorpay_payment_id: response.razorpay_payment_id, razorpay_order_id: response.razorpay_order_id }),
          });
          setSuccess(true);
          setTimeout(() => router.push('/orders'), 2000);
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch {
      setPaying(false);
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-80 bg-surface rounded-xl" />
        <div className="h-64 bg-surface rounded-xl" />
      </div>
    </div>
  );

  if (!order) return <div className="text-center py-20 text-text3">Order not found</div>;
  if (success) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-text mb-2">Payment Successful!</h2>
        <p className="text-text2">Redirecting to orders...</p>
      </div>
    </div>
  );

  const { breakdown } = calculatePlatformFee(order.deal_value ?? 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text mb-8">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-semibold text-text mb-4">Order Details</h2>
              <h3 className="text-lg font-bold text-text mb-2">{order.title}</h3>
              <p className="text-text2 text-sm mb-4">{order.description}</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm">
                  {(order as unknown as Record<string, Record<string, string>>).builder?.full_name?.[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="text-text text-sm font-semibold">{(order as unknown as Record<string, Record<string, string>>).builder?.full_name}</p>
                    {(order as unknown as Record<string, Record<string, string>>).builder_profile?.verification_status === 'verified' && <BadgeCheck size={13} className="text-blue" />}
                  </div>
                  <p className="text-text3 text-xs">Builder</p>
                </div>
              </div>
              <p className="text-text3 text-sm">Delivery in {order.delivery_days} days</p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h2 className="font-semibold text-text mb-3">Your Requirements</h2>
              <textarea {...register('requirements')} rows={4}
                placeholder="Describe your specific requirements, customizations, and any other details..."
                className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors resize-none text-sm" />
              {errors.requirements && <p className="text-red text-xs mt-1">{errors.requirements.message}</p>}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-surface border border-border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold text-text">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text2">
                  <span>Agent/Deal price</span>
                  <span className="text-text">₹{breakdown.dealValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-text2">
                  <span>Platform fee (5%, min ₹199)</span>
                  <span className="text-text">₹{breakdown.platformFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-text2">
                  <span>GST (18% on fee)</span>
                  <span className="text-text">₹{breakdown.gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-bold text-lg">
                  <span className="text-text">Total</span>
                  <span className="text-brand">₹{breakdown.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-green/5 border border-green/20 rounded-lg px-3 py-2.5 flex items-start gap-2">
                <Shield size={14} className="text-green mt-0.5 shrink-0" />
                <p className="text-green text-xs leading-snug">Your money is held safely in escrow until you approve the work.</p>
              </div>

              <button type="submit" disabled={paying}
                className="w-full bg-brand hover:bg-brand2 disabled:opacity-50 text-white rounded-xl py-3 font-semibold transition-colors">
                {paying ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
