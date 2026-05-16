'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/navbar/Navbar';
import { ChatManager } from '@/components/chat/ChatManager';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!profile) return;
    if (profile.current_mode === 'buyer' && !profile.buyer_onboarding_complete) {
      router.push('/onboarding/buyer');
    } else if (profile.current_mode === 'builder' && !profile.builder_onboarding_complete) {
      router.push('/onboarding/builder');
    }
  }, [profile, isLoading]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14">{children}</main>
      <ChatManager />
    </div>
  );
}
