import { NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { razorpay_payment_id, razorpay_order_id } = await request.json() as { razorpay_payment_id: string; razorpay_order_id: string };
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = createServiceClient();
    const { data: order } = await service.from('orders').select('delivery_days').eq('id', params.id).single();
    const dueDate = order ? new Date(Date.now() + order.delivery_days * 24 * 60 * 60 * 1000).toISOString() : null;

    await service.from('orders').update({
      order_status: 'active',
      escrow_status: 'held',
      razorpay_payment_id,
      razorpay_order_id,
      due_date: dueDate,
    }).eq('id', params.id).eq('buyer_id', user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
