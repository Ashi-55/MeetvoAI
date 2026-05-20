'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/navbar/Navbar';
import { ChatManager } from '@/components/chat/ChatManager';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!profile) return;
    // Skip redirect if user is already on auth/welcome/onboarding pages
    if (pathname === '/login' || pathname === '/signup' || pathname === '/welcome' || pathname?.startsWith('/auth') || pathname?.startsWith('/onboarding')) return;

    const hasCompletedAnyOnboarding = Boolean(profile.buyer_onboarding_complete || profile.builder_onboarding_complete);
    if (!hasCompletedAnyOnboarding) {
      router.push('/welcome');
      return;
    }

    // Only redirect to onboarding if user has selected a role AND hasn't completed onboarding
    if (profile.current_mode === 'buyer' && !profile.buyer_onboarding_complete) {
      router.push('/onboarding/buyer');
    } else if (profile.current_mode === 'builder' && !profile.builder_onboarding_complete) {
      router.push('/onboarding/builder');
    }
    // If current_mode is null, user should be on welcome page (no redirect needed)
  }, [profile, isLoading, router, pathname]);

  return (
    <div className="min-h-screen bg-page">
      <Navbar />
      <main className="pt-14">{children}</main>
      <ChatManager />
    </div>
  );
}
