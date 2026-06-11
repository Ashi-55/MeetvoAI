import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { orderId, amount, requirements } = await request.json() as { orderId: string; amount: number; requirements: string };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Create Razorpay order via API. The browser needs the key id; it is safe
    // to expose, but some local envs only define RAZORPAY_KEY_ID.
    const rzpKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

    if (!rzpKeyId || !rzpSecret) {
      return NextResponse.json({ error: 'Razorpay credentials missing' }, { status: 500 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${rzpKeyId}:${rzpSecret}`).toString('base64')}`,
      },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt: orderId }),
    });

    const rzpOrder = await rzpRes.json() as { id?: string; error?: { description?: string } };
    if (!rzpRes.ok || !rzpOrder.id) {
      return NextResponse.json(
        { error: rzpOrder.error?.description || 'Razorpay order creation failed' },
        { status: rzpRes.status || 500 }
      );
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ razorpay_order_id: rzpOrder.id, description: requirements })
      .eq('id', orderId)
      .eq('buyer_id', user.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ razorpayOrderId: rzpOrder.id, key: rzpKeyId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment' },
      { status: 500 }
    );
  }
}
