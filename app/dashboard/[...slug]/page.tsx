import Link from 'next/link';
import { redirect } from 'next/navigation';

interface DashboardFallbackPageProps {
  params: {
    slug: string[];
  };
}

function titleCase(text: string) {
  return text
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

const known = new Set([
  'deals',
  'analytics',
  'agents',
  'deployed',
  'notifications',
  'settings',
  'builder',
]);

export default function DashboardFallbackPage({ params }: DashboardFallbackPageProps) {
  const slug = params.slug || [];
  const first = slug[0];

  // Redirect to concrete pages when we know them
  if (first && known.has(first)) {
    redirect(`/dashboard/${first}`);
  }

  const title = slug.map((segment) => titleCase(segment)).join(' / ');

  return (
    <main className="min-h-screen bg-page px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[#1B2540] bg-[#111827] p-10 shadow-2xl shadow-black/30">
        <h1 className="text-3xl font-bold">{title || 'Dashboard'}</h1>
        <p className="mt-4 text-[#A8B3CF] text-sm leading-relaxed">
          This area doesn't have a dedicated page yet. We created quick entry points to the closest existing dashboard sections below.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="rounded-2xl bg-[#5B5EF7] px-5 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#3C73D8]">
            Go to Dashboard
          </Link>
          <Link href="/dashboard/deals" className="rounded-2xl border border-[#5B5EF7] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00C2A8] hover:text-[#00C2A8]">
            My Deals
          </Link>
          <Link href="/dashboard/agents" className="rounded-2xl border border-[#00C2A8] px-5 py-3 text-sm font-semibold text-[#00C2A8] transition hover:bg-[#00C2A8]/10">
            My Agents
          </Link>
          <Link href="/dashboard/notifications" className="rounded-2xl border border-[#00C2A8] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#00C2A8] hover:text-[#00C2A8]">
            Notifications
          </Link>
        </div>
      </div>
    </main>
  );
}
