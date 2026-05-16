import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, category, price, pricing_model } = body as {
      name: string;
      description: string;
      category: string;
      price: number;
      pricing_model: string;
    };

    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const userId = userData?.data?.user?.id;

    if (userError || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const insertPayload: any = {
      builder_id: userId,
      title: name,
      description,
      category,
      is_published: true,
      status: 'published',
      price: Number(price) || null,
      yearly_price: pricing_model === 'yearly' ? Number(price) || null : null,
      tags: [],
      integrations: [],
      capabilities: [],
    };

    const { data, error } = await supabase.from('agents').insert(insertPayload).select('id').single();
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, agentId: data?.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Unable to publish agent' }, { status: 500 });
  }
}
