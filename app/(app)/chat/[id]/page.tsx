"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default function ChatThreadRedirectPage({ params }: Props) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/messages?conversation=${encodeURIComponent(params.id)}`);
  }, [router, params.id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-page text-white">
      <div className="rounded-3xl border border-[#1E1B3A] bg-[#08080F] p-8 text-center shadow-2xl shadow-black/40">
        <p className="text-xl font-semibold">Redirecting to the selected conversation...</p>
      </div>
    </div>
  );
}
