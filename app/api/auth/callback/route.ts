import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      return NextResponse.redirect(new URL('/login', url.origin));
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    );

    await supabase.auth.exchangeCodeForSession(code);

    return NextResponse.redirect(new URL('/dashboard', url.origin));
  } catch {
    return NextResponse.redirect(new URL('/login', new URL(request.url).origin));
  }
}

