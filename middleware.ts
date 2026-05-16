import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function createSupabase(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          // Update both request and response cookies so auth works in the same middleware cycle
          request.cookies.set({ name, value, ...(options as any) });
          response.cookies.set({ name, value, ...(options as any) });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: '', ...(options as any) });
          response.cookies.set({ name, value: '', ...(options as any) });
        },
      },
    }
  );

  return { supabase, response };
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabase(request);

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/dashboard', '/studio', '/chat', '/orders'];
  const isProtected = protectedRoutes.some((p) => pathname.startsWith(p));

  // If no session, redirect to /login for protected routes
  if (isProtected && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // If logged in, prevent access to login/signup
  if (session && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};

