import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (secret && signature) {
      const expectedSig = crypto.createHmac('sha256', secret).update(body).digest('hex');
      if (expectedSig !== signature) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body) as { event: string; payload: Record<string, Record<string, unknown>> };
    const service = createServiceClient();

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment?.entity as Record<string, string>;
      if (payment?.order_id) {
        await service.from('orders').update({ escrow_status: 'held', order_status: 'active', razorpay_payment_id: payment.id }).eq('razorpay_order_id', payment.order_id);
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment?.entity as Record<string, string>;
      if (payment?.order_id) {
        await service.from('orders').update({ order_status: 'cancelled' }).eq('razorpay_order_id', payment.order_id);
      }
    }

    if (event.event === 'subscription.activated') {
      const sub = event.payload.subscription?.entity as Record<string, string>;
      if (sub?.id) {
        await service.from('builder_subscriptions').update({ status: 'active', ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).eq('razorpay_subscription_id', sub.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
