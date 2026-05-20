export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08080F] px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ae9bc9]">404</p>
        <h1 className="mt-3 text-2xl font-extrabold">Page not found</h1>
        <p className="mt-3 text-sm text-[#9490B5]">This page does not exist or has moved.</p>
        <a
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-[#ae9bc9] px-4 py-2 text-sm font-bold text-[#08080F]"
        >
          Back to Dashboard
        </a>
      </section>
    </main>
  );
}
