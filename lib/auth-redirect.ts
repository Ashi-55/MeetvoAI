export function getAuthRedirectUrl(next = '/welcome') {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const safeNext = next.startsWith('/') ? next : '/welcome';
  const callback = new URL('/auth/callback', origin);
  callback.searchParams.set('next', safeNext);
  return callback.toString();
}
