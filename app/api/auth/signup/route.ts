import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { full_name, email, password } = await request.json();

    if (!full_name || !email || !password) {
      return NextResponse.json({ error: 'Full name, email, and password are required.' }, { status: 400 });
    }

    const service = createServiceClient();

    const { data: createData, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      email_confirm: true,
    });

    if (createError || !createData.user) {
      return NextResponse.json({ error: createError?.message || 'Failed to create user.' }, { status: 500 });
    }

    const { data: profileData, error: profileError } = await service.from('profiles').insert({
      id: createData.user.id,
      full_name,
      email,
      current_mode: 'buyer',
      buyer_onboarding_complete: false,
      builder_onboarding_complete: false,
    });

    if (profileError) {
      console.error('Profile insert failed:', profileError);
      return NextResponse.json({
        error: profileError.message || 'Failed to create user profile. Ensure the profiles table exists in Supabase.',
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create account.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
