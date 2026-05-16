import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const admin = createClient();

    // Delete in dependency order (best-effort)
    await admin.from('messages').delete().neq('id', '');
    await admin.from('conversations').delete().neq('id', '');
    await admin.from('deals').delete().neq('id', '');
    await admin.from('orders').delete().neq('id', '');

    // profiles
    await admin.from('builder_profiles').delete().neq('id', '');
    await admin.from('business_profiles').delete().neq('id', '');
    await admin.from('profiles').delete().neq('id', '');

    await admin.from('agents').delete().neq('id', '');
    await admin.from('notifications').delete().neq('id', '');

    return NextResponse.json({ success: true, message: 'Demo data cleared' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Clear failed' }, { status: 500 });
  }
}

