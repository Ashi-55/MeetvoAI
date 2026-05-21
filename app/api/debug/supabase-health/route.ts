import { NextResponse } from 'next/server';

function clean(value?: string) {
  return (value || '').trim().replace(/^["']|["']$/g, '');
}

async function checkKey(label: string, key: string, url: string) {
  if (!key || !url) {
    return { label, ok: false, status: 'missing' };
  }

  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      cache: 'no-store',
    });

    return { label, ok: response.ok, status: response.status };
  } catch {
    return { label, ok: false, status: 'request-failed' };
  }
}

export async function GET() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceKey = clean(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

  const [anon, service] = await Promise.all([
    checkKey('anon', anonKey, url),
    checkKey('service', serviceKey, url),
  ]);

  return NextResponse.json({
    urlConfigured: Boolean(url),
    anon,
    service,
  });
}
