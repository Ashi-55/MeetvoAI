import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, deal_id } = (await request.json()) as {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      deal_id: string;
    };

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return NextResponse.json({ error: 'Missing Razorpay secret' }, { status: 500 });

    const body = JSON.stringify({ razorpay_order_id, razorpay_payment_id });
    const expected = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = supabaseServer();

    // Update deal status
    await supabase.from('deals').update({
      status: 'in_progress',
      razorpay_payment_id,
      razorpay_order_id,
    }).eq('id', deal_id);

    // Update offer_card status to paid
    await supabase.from('offer_cards').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('deal_id', deal_id);

    // Insert system message
    const { data: deal } = await supabase.from('deals').select('buyer_id,builder_id,offer_id').eq('id', deal_id).single();
    if (deal) {
      const content = 'payment secured';
      await supabase.from('messages').insert({
        conversation_id: null,
        offer_data: null,
        content,
        role: 'system',
        sender_id: deal.builder_id,
        message_type: 'system',
        metadata: { deal_id },
      });
    }

    // Notify builder
    await supabase.from('notifications').insert({
      user_id: deal?.builder_id,
      title: 'New order in escrow',
      message: `Payment secured for deal ${deal_id}`,
      is_read: false,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Escrow verify failed' }, { status: 500 });
  }
}

