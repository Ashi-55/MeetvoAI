import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = createServiceClient();
    const { data: order } = await service.from('orders').select('*').eq('id', params.id).single();
    if (!order || order.buyer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await service.from('orders').update({
      order_status: 'completed',
      escrow_status: 'released',
      approved_at: new Date().toISOString(),
    }).eq('id', params.id);

    await service.from('builder_profiles').update({
      total_earnings: order.deal_value,
      total_deals: 1,
    }).eq('id', order.builder_id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
