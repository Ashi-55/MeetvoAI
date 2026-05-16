import { NextResponse } from 'next/server';
import { createServiceClient, createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { notes } = await request.json() as { notes: string };
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const service = createServiceClient();
    const now = new Date();
    const autoApprove = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await service.from('orders').update({
      order_status: 'submitted',
      submitted_at: now.toISOString(),
      auto_approve_at: autoApprove.toISOString(),
      admin_notes: notes || null,
    }).eq('id', params.id).eq('builder_id', user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
