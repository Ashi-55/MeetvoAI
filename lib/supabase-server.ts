import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function supabaseServer() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
        set(name: string, value: string, options: { httpOnly?: boolean; path?: string; maxAge?: number } = {}) {
          cookies().set({
            name,
            value,
            httpOnly: options.httpOnly ?? true,
            path: options.path ?? '/',
            maxAge: options.maxAge,
          });
        },
        remove(name: string, options: { path?: string } = {}) {
          cookies().set({
            name,
            value: '',
            httpOnly: true,
            path: options.path ?? '/',
            maxAge: -1,
          });
        },
      },
    }
  );
}

