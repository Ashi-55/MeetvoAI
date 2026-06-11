import { NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json() as {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    };
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return NextResponse.json({ error: 'Razorpay secret missing' }, { status: 500 });

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (!razorpay_signature || expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: order } = await service
      .from('orders')
      .select('delivery_days')
      .eq('id', params.id)
      .eq('buyer_id', user.id)
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const dueDate = order ? new Date(Date.now() + order.delivery_days * 24 * 60 * 60 * 1000).toISOString() : null;

    const { error: updateError } = await service.from('orders').update({
      order_status: 'active',
      escrow_status: 'held',
      razorpay_payment_id,
      razorpay_order_id,
      due_date: dueDate,
    }).eq('id', params.id).eq('buyer_id', user.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    );
  }
}
