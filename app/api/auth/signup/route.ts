import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

function clean(value?: string) {
  return (value || '').trim().replace(/^["']|["']$/g, '');
}

export async function POST(request: Request) {
  try {
    const { full_name, email, password } = await request.json();

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Full name, email, and password are required.' }, { status: 400 });
    }

    const service = createServiceClient();
    const supabaseUrl = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceKey = clean(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

    const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        user_metadata: { full_name },
        email_confirm: true,
      }),
    });

    const createData = await createResponse.json();

    if (!createResponse.ok || !createData.id) {
      return NextResponse.json({ error: createData.message || createData.error || 'Failed to create user.' }, { status: 500 });
    }

    // Create profile for the user
    // We omit current_mode so it will use the database default,
    // then we update it to null in a separate step
    const { error: profileCreateError } = await service.from('profiles').insert({
      id: createData.id,
      full_name,
      email,
    });

    if (profileCreateError) {
      console.error('Profile insert failed:', profileCreateError);
      // Don't fail here - profile might already exist from auth trigger
    }

    // Explicitly set current_mode to null for role selection on welcome page
    const { error: profileError } = await service.from('profiles').update({
      current_mode: null,
      buyer_onboarding_complete: false,
      builder_onboarding_complete: false,
    }).eq('id', createData.id);

    if (profileError) {
      console.error('Profile upsert failed:', profileError);
      return NextResponse.json({
        error: profileError.message || 'Failed to create or update user profile. Ensure the profiles table exists in Supabase.',
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create account.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
