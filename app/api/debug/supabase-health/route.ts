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

function getJwtRole(key: string) {
  try {
    const payload = key.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return typeof decoded.role === 'string' ? decoded.role : null;
  } catch {
    return null;
  }
}

async function checkAdminAccess(key: string, url: string) {
  if (!key || !url) {
    return { ok: false, status: 'missing' };
  }

  try {
    const response = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
    });

    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 'request-failed' };
  }
}

export async function GET() {
  const url = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const serviceKey = clean(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);

  const [anon, service, admin] = await Promise.all([
    checkKey('anon', anonKey, url),
    checkKey('service', serviceKey, url),
    checkAdminAccess(serviceKey, url),
  ]);

  return NextResponse.json({
    urlConfigured: Boolean(url),
    anon,
    service: {
      ...service,
      role: getJwtRole(serviceKey),
      admin,
    },
  });
}
