import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isStarterPublishLimitReached, isTrialExpired, STARTER_AGENT_LIMIT, TRIAL_ENDED_MESSAGE } from '@/lib/trial';

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
    const userId = userData?.user?.id;

    if (userError || !userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [{ data: profile }, { data: builderProfile }, { count: publishedCount }] = await Promise.all([
      supabase.from('profiles').select('created_at').eq('id', userId).maybeSingle(),
      supabase.from('builder_profiles').select('subscription_plan, subscription_status').eq('id', userId).maybeSingle(),
      supabase
        .from('agents')
        .select('id', { count: 'exact', head: true })
        .eq('builder_id', userId)
        .or('status.eq.published,is_published.eq.true'),
    ]);

    if (isTrialExpired({
      createdAt: profile?.created_at || userData.user?.created_at,
      subscriptionStatus: builderProfile?.subscription_status,
    })) {
      return NextResponse.json({ success: false, error: TRIAL_ENDED_MESSAGE }, { status: 402 });
    }

    if (isStarterPublishLimitReached(publishedCount || 0, builderProfile?.subscription_plan, builderProfile?.subscription_status)) {
      return NextResponse.json({
        success: false,
        error: `Starter plans include publishing up to ${STARTER_AGENT_LIMIT} agents. Upgrade to keep publishing on MeetvoAI.`,
      }, { status: 402 });
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
