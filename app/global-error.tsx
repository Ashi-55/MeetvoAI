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
        <main style={{ minHeight: '100vh', background: '#08080F', color: 'white', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ maxWidth: 420, border: '1px solid #1E1B3A', background: '#100F1C', borderRadius: 16, padding: 24, textAlign: 'center' }}>
            <p style={{ color: '#ae9bc9', fontSize: 12, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase' }}>Application Error</p>
            <h1 style={{ marginTop: 12, fontSize: 24, fontWeight: 800 }}>MeetvoAI could not load</h1>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 24, border: 0, borderRadius: 12, background: '#ae9bc9', color: '#08080F', padding: '10px 16px', fontWeight: 800 }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
