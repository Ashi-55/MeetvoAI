'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: '100vh', background: '#0B1020', color: 'white', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ maxWidth: 420, border: '1px solid #1B2540', background: '#131A2A', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#00C2A8', fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' }}>Application Error</p>
            <h1 style={{ marginTop: 12, fontSize: 24, fontWeight: 800 }}>MeetvoAI could not load</h1>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 24, border: 0, borderRadius: 12, background: '#00C2A8', color: '#0B1020', padding: '10px 16px', fontWeight: 800 }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
