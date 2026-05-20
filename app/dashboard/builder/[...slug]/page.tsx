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
      <div className="mx-auto max-w-4xl rounded-3xl border border-[#1E1B3A] bg-[#090C16] p-10 shadow-2xl shadow-black/30">
        <h1 className="text-3xl font-bold">{title || 'Builder Dashboard'}</h1>
        <p className="mt-4 text-[#8A9BB5] text-sm leading-relaxed">
          This builder page is not available yet, but your dashboard remains active and ready to use.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard/builder" className="rounded-2xl bg-[#ae9bc9] px-5 py-3 text-sm font-semibold text-[#08080F] transition hover:bg-[#6F4EEA]">
            Back to Builder Dashboard
          </Link>
          <Link href="/studio" className="rounded-2xl border border-[#ae9bc9] px-5 py-3 text-sm font-semibold text-[#ae9bc9] transition hover:bg-[#ae9bc9]/10">
            Open AI Studio
          </Link>
          <Link href="/messages" className="rounded-2xl border border-[#4F8EF7] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#ae9bc9] hover:text-[#ae9bc9]">
            View Messages
          </Link>
        </div>
      </div>
    </main>
  );
}
