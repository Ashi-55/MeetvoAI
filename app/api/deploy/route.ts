import { NextResponse } from 'next/server';

import { createClient, createServiceClient } from '@/lib/supabase/server';

function cleanSubdomain(input: string) {
  return (input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export async function POST(request: Request) {
  try {
    const { subdomain, studio_build_id, agent_type, config_json, name } = (await request.json()) as {
      subdomain: string;
      studio_build_id: string;
      agent_type: string;
      config_json: unknown;
      name: string;
    };

    const clean = cleanSubdomain(subdomain);
    if (!clean) return NextResponse.json({ success: false, error: 'Invalid subdomain' }, { status: 400 });

    const serverSupabase = createClient();
    const { data: authData } = await serverSupabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const service = createServiceClient();
    const { data: build, error: buildError } = await service
      .from('studio_builds')
      .select('id, builder_id')
      .eq('id', studio_build_id)
      .single();

    if (buildError || !build || build.builder_id !== userId) {
      return NextResponse.json({ success: false, error: 'Build not found or unauthorized' }, { status: 404 });
    }

    let finalSub = clean;
    const { data: existing } = await service
      .from('deployed_agents')
      .select('subdomain')
      .eq('subdomain', finalSub)
      .maybeSingle();

    if (existing) {
      finalSub = `${finalSub}${Math.floor(100 + Math.random() * 900)}`;
    }

    const { error: insertErr } = await service.from('deployed_agents').insert({
      builder_id: userId,
      subdomain: finalSub,
      studio_build_id,
      agent_type,
      config_json,
      name,
      status: 'deploying',
    });

    if (insertErr) {
      return NextResponse.json({ success: false, error: insertErr.message ?? 'Failed to insert deployed agent' }, { status: 500 });
    }

    await service.from('studio_builds').update({ status: 'deployed' }).eq('id', studio_build_id);

    return NextResponse.json({ success: true, url: `${finalSub}.meetvoai.in` });
  } catch {
    return NextResponse.json({ success: false, error: 'Deploy failed' }, { status: 500 });
  }
}

