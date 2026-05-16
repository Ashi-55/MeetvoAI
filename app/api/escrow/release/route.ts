import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server'; // Adjusted to the correct export
const supabase = createClient(); // Update the usage accordingly
// const supabase = createSupabaseClient(); // This line has been removed to avoid redeclaration

export async function POST(request: Request) {
  try {
    const { deal_id } = (await request.json()) as { deal_id: string };

    // Use the previously defined supabase variable
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify auth is business owner
    const { data: deal } = await supabase.from('deals').select('buyer_id,builder_id').eq('id', deal_id).single();
    if (!deal) return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    if (deal.buyer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await supabase.from('deals').update({ status: 'completed', escrow_status: 'released' }).eq('id', deal_id);

    // Increment builder totals
    await supabase.rpc?.('increment_builder_totals', { builder_id: deal.builder_id, deal_id });
    // Fallback without RPC:
    await supabase.from('builder_profiles').update({
      total_deals: (supabase as any).raw ? (supabase as any).raw('total_deals + 1') : undefined,
      total_earned: (supabase as any).raw ? (supabase as any).raw('total_earned + 0') : undefined,
    }).eq('user_id', deal.builder_id);

    // Insert system message + notifications
    await supabase.from('notifications').insert([
      { user_id: deal.builder_id, title: 'Payment released', message: `Escrow released for deal ${deal_id}`, is_read: false },
      { user_id: deal.buyer_id, title: 'Payment released', message: `Your order ${deal_id} is completed`, is_read: false },
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Escrow release failed' }, { status: 500 });
  }
}

