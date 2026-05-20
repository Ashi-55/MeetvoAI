'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08080F] px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ae9bc9]">Something went wrong</p>
        <h1 className="mt-3 text-2xl font-extrabold">We hit a page error</h1>
        <p className="mt-3 text-sm text-[#9490B5]">
          {error.message || 'The page could not be loaded. Try again or return to your dashboard.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-[#ae9bc9] px-4 py-2 text-sm font-bold text-[#08080F]"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-xl border border-[#1E1B3A] px-4 py-2 text-sm font-bold text-white"
          >
            Dashboard
          </a>
        </div>
      </section>
    </main>
  );
}
