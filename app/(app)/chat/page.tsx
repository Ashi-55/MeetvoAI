"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/messages');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-page text-white">
      <div className="rounded-3xl border border-[#1B2540] bg-[#0B1020] p-8 text-center shadow-2xl shadow-black/40">
        <p className="text-xl font-semibold">Redirecting to your messages...</p>
        <p className="mt-2 text-sm text-[#A8B3CF]">If you are not redirected automatically, use the messages menu.</p>
      </div>
    </div>
  );
}
