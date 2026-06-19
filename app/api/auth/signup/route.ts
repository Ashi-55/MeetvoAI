import { NextResponse } from 'next/server';

function clean(value?: string) {
  return (value || '').trim().replace(/^["']|["']$/g, '');
}

function cleanUrl(value?: string) {
  return clean(value).replace(/\/+$/, '');
}

export async function POST(request: Request) {
  try {
    const { full_name, email, password, role } = await request.json();
    const currentMode = role === 'builder' ? 'builder' : role === 'buyer' ? 'buyer' : null;

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Full name, email, and password are required.' }, { status: 400 });
    }

    const supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const serviceKey = clean(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

    const createResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        data: { full_name },
      }),
    });

    const createData = await createResponse.json();

    const userId = createData.user?.id || createData.id;

    if (!createResponse.ok || !userId) {
      return NextResponse.json({
        error: createData.message || createData.error || 'Failed to create user.',
        stage: 'create-user',
        status: createResponse.status,
      }, { status: 500 });
    }

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?on_conflict=id`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        id: userId,
        full_name,
        email,
        current_mode: currentMode,
        buyer_onboarding_complete: false,
        builder_onboarding_complete: false,
      }),
    });

    if (!profileResponse.ok) {
      const profileError = await profileResponse.json().catch(() => null);
      console.error('Profile upsert failed:', profileError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create account.';
    return NextResponse.json({ error: message, stage: 'unexpected' }, { status: 500 });
  }
}
