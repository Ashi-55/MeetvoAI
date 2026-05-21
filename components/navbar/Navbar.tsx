'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, MessageSquare, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { AvatarDropdown } from './AvatarDropdown';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Studio', href: '/studio' },
  { label: 'Pricing', href: '/pricing' },
];

const PUBLIC_NAV_LINKS = [
  { label: 'Home', href: '/#home' },
  { label: 'Services', href: '/#services' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
];

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { totalUnread } = useChatStore();
  const { unreadCount } = useNotificationStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isPublicHome = pathname === '/';
  const navLinks = user && !isPublicHome ? NAV_LINKS : PUBLIC_NAV_LINKS;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className={`fixed inset-x-0 top-0 z-50 h-16 border-b border-[#1E1B3A] transition-all duration-300 ${scrolled ? 'backdrop-blur-xl bg-[#08080F]/95' : 'bg-[#08080F]'}`}>
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold text-white">
          <span className="text-lg font-black tracking-[-0.03em]">
            Meetvo<span style={{ color: '#7C5CFC' }}>AI</span>
          </span>
        </Link>

        <nav className="absolute inset-x-0 top-0 hidden h-full items-center justify-center md:flex pointer-events-none">
          <div className="inline-flex pointer-events-auto rounded-full border border-[#1E1B3A] bg-[#100F1C] p-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium text-[#9490B5] transition hover:bg-[#1E1B3A] hover:text-white ${link.href === '/studio' ? 'ai-studio-nav-link' : ''}`}
              >
                <span>{link.label}</span>
                {link.href === '/studio' && <span className="studio-new-badge">NEW</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              <Link href="/messages" className="relative inline-flex items-center justify-center rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-2 text-[#9490B5] transition hover:border-[#7C5CFC] hover:text-white">
                <MessageSquare size={18} />
                {totalUnread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red text-[10px] font-semibold text-white px-1.5">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </Link>
              <button className="relative inline-flex items-center justify-center rounded-2xl border border-[#1E1B3A] bg-[#100F1C] p-2 text-[#9490B5] transition hover:border-[#7C5CFC] hover:text-white">
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red text-[10px] font-semibold text-white px-1.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AvatarDropdown profile={profile} onSignOut={handleSignOut} />
            </>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="text-sm font-medium text-[#9490B5] transition hover:text-white">Sign In</Link>
              <Link href="/signup" className="rounded-2xl bg-[#7C5CFC] px-4 py-2 text-sm font-semibold text-[#08080F] transition hover:bg-[#6F4EEA]">Get Started Free</Link>
            </div>
          )}

          <button className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#1E1B3A] bg-[#100F1C] text-[#9490B5] transition hover:border-[#7C5CFC] hover:text-white md:hidden" onClick={() => setMobileOpen((prev) => !prev)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[#1E1B3A] bg-[#08080F] px-4 py-4">
          <div className="space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-2xl border border-[#1E1B3A] bg-[#100F1C] px-4 py-3 text-sm font-medium text-[#9490B5] transition hover:bg-[#1E1B3A] hover:text-white ${link.href === '/studio' ? 'ai-studio-nav-link' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>{link.label}</span>
                {link.href === '/studio' && <span className="studio-new-badge">NEW</span>}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/messages" className="block rounded-2xl border border-[#1E1B3A] bg-[#100F1C] px-4 py-3 text-sm font-medium text-[#9490B5] transition hover:bg-[#1E1B3A] hover:text-white" onClick={() => setMobileOpen(false)}>
                  Messages
                </Link>
                <button onClick={handleSignOut} className="w-full rounded-2xl border border-[#1E1B3A] bg-[#100F1C] px-4 py-3 text-left text-sm font-medium text-[#9490B5] transition hover:bg-[#1E1B3A] hover:text-white">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block rounded-2xl border border-[#1E1B3A] bg-[#100F1C] px-4 py-3 text-sm font-medium text-[#9490B5] transition hover:bg-[#1E1B3A] hover:text-white" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/signup" className="block rounded-2xl bg-[#7C5CFC] px-4 py-3 text-sm font-semibold text-[#08080F] transition hover:bg-[#6F4EEA]" onClick={() => setMobileOpen(false)}>
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
