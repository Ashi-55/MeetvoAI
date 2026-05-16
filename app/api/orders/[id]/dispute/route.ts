import { NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { reason } = await request.json() as { reason: string };
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = createServiceClient();
    await service.from('orders').update({
      order_status: 'disputed',
      escrow_status: 'disputed',
      dispute_reason: reason,
    }).eq('id', params.id).eq('buyer_id', user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
