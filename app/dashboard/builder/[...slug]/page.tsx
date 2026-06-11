import Link from 'next/link';

interface BuilderDashboardFallbackPageProps {
  params: {
    slug: string[];
  };
}

function titleCase(text: string) {
  return text
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export default function BuilderDashboardFallbackPage({ params }: BuilderDashboardFallbackPageProps) {
  const slug = params.slug || [];
  const title = slug.map((segment) => titleCase(segment)).join(' / ');

  return (
    <main className="min-h-screen bg-page px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[#1B2540] bg-[#111827] p-10 shadow-2xl shadow-black/30">
        <h1 className="text-3xl font-bold">{title || 'Builder Dashboard'}</h1>
        <p className="mt-4 text-[#A8B3CF] text-sm leading-relaxed">
          This builder page is not available yet, but your dashboard remains active and ready to use.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/builder" className="rounded-2xl bg-[#00C2A8] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#4B4EE8]">
            Back to Builder Dashboard
          </Link>
          <Link href="/studio" className="rounded-2xl border border-[#00C2A8] px-5 py-3 text-sm font-semibold text-[#00C2A8] transition hover:bg-[#00C2A8]/10">
            Open AI Studio
          </Link>
          <Link href="/messages" className="rounded-2xl border border-[#5B5EF7] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00C2A8] hover:text-[#00C2A8]">
            View Messages
          </Link>
        </div>
      </div>
    </main>
  );
}
