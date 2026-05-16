import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { orderId, amount, requirements } = await request.json() as { orderId: string; amount: number; requirements: string };

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Create Razorpay order via API
    const rzpKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const rzpSecret = process.env.RAZORPAY_KEY_SECRET;

    let razorpayOrderId = `rzp_${Date.now()}`;

    if (rzpKeyId && rzpSecret) {
      try {
        const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${rzpKeyId}:${rzpSecret}`).toString('base64')}`,
          },
          body: JSON.stringify({ amount: amount * 100, currency: 'INR', receipt: orderId }),
        });
        const rzpOrder = await rzpRes.json() as { id: string };
        razorpayOrderId = rzpOrder.id;
      } catch {}
    }

    await supabase.from('orders').update({ razorpay_order_id: razorpayOrderId, description: requirements }).eq('id', orderId);

    return NextResponse.json({ razorpayOrderId, key: rzpKeyId || '' });
  } catch {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
  }
}
