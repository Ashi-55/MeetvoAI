'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

const hiddenPaths = [
  '/',
  '/dashboard',
  '/dashboard/builder',
  '/studio',
  '/marketplace',
  '/pricing',
  '/messages',
  '/login',
  '/signup',
  '/welcome',
  '/onboarding',
];

export function GlobalBackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    setCanGoBack(window.history.length > 1);
  }, []);

  if (
    !canGoBack ||
    hiddenPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push('/');
        }
      }}
      className="fixed top-5 left-5 z-50 inline-flex items-center gap-2 rounded-full border border-[#1E1B3A] bg-[#100F1C] px-3 py-2 text-sm font-medium text-white shadow-lg shadow-black/30 transition hover:border-[#ae9bc9] hover:bg-[#0E1624] focus:outline-none focus:ring-2 focus:ring-[#ae9bc9]/40"
    >
      <ArrowLeft size={16} />
      Back
    </button>
  );
}

