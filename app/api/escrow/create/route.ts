import { NextResponse } from 'next/server';
import crypto from 'crypto';

import { createClient } from '@supabase/supabase-js'; // or the correct export if different
const supabaseServer = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_ANON_KEY ?? ''
); // Adjust as necessary
import { razorpay } from '@/lib/razorpay';

export async function POST(request: Request) {
  try {
    const { offer_id, amount, business_id, builder_id } = (await request.json()) as {
      offer_id: string;
      amount: number;
      business_id: string;
      builder_id: string;
    };

    const supabase = supabaseServer;
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user || user.id !== business_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const amt = Math.round(Number(amount) || 0);
    if (!amt || amt < 1) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

    const fee = Math.max(Math.round(amt * 0.05), 199);
    const gst = Math.round(fee * 0.18);
    const total = amt + fee + gst;

    // Create Razorpay order (amount in paise)
    const receipt = `deal_${offer_id}_${Date.now()}`;
    const order = await razorpay.orders.create({
      amount: total * 100,
      currency: 'INR',
      receipt,
      payment_capture: 1,
    });

    const dealValue = total;

    const { data: deal, error } = await supabase.from('deals').insert({
      offer_id,
      buyer_id: business_id,
      builder_id,
      deal_value: dealValue,
      status: 'payment_pending',
      auto_approve_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      razorpay_order_id: order.id,
    }).select('*').single();

    if (error) {
      return NextResponse.json({ error: error.message ?? 'Failed to create deal' }, { status: 500 });
    }

    return NextResponse.json({
      order_id: order.id,
      amount: total * 100,
      currency: 'INR',
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? '',
      deal_id: deal.id,
    });
  } catch {
    return NextResponse.json({ error: 'Escrow create failed' }, { status: 500 });
  }
}

