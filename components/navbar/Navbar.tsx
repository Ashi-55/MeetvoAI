'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Bell, MessageSquare, Menu, Moon, Sun, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { AvatarDropdown } from './AvatarDropdown';
import { HandshakeIcon } from '@/components/ui/HandshakeLogo';

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
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isPublicHome = pathname === '/';
  const navLinks = user && !isPublicHome ? NAV_LINKS : PUBLIC_NAV_LINKS;

  useEffect(() => {
    setMounted(true);
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

  function toggleTheme() {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }

  return (
    <header className={`fixed inset-x-0 top-0 z-50 h-16 border-b transition-all duration-300 ${scrolled ? 'border-border bg-page shadow-[0_14px_40px_rgba(0,0,0,0.16)] backdrop-blur-2xl' : 'border-border bg-page backdrop-blur-xl'}`}>
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 font-semibold text-text">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#00C2A8]/30 bg-[#00C2A8]/10 text-[#00C2A8] shadow-[0_12px_30px_rgba(0,194,168,0.18)]">
            <HandshakeIcon size={20} />
          </span>
          <span className="text-lg font-black tracking-[-0.03em]">
            Meetvo<span className="text-[#00C2A8]">AI</span>
          </span>
        </Link>

        <nav className="absolute inset-x-0 top-0 hidden h-full items-center justify-center md:flex pointer-events-none">
          <div className="inline-flex pointer-events-auto rounded-[14px] border border-border bg-surface p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-[10px] px-4 py-2 text-sm font-medium text-text2 transition hover:bg-surface2 hover:text-text ${link.href === '/studio' ? 'ai-studio-nav-link' : ''}`}
              >
                <span>{link.label}</span>
                {link.href === '/studio' && <span className="studio-new-badge">NEW</span>}
              </Link>
            ))}
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-10 w-10 items-center justify-center rounded-[12px] border border-border bg-surface text-text2 transition hover:border-[#5B5EF7]/50 hover:text-text md:inline-flex"
            aria-label="Toggle theme"
            title={mounted && resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {mounted && resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user && !isPublicHome ? (
            <>
              <Link href="/messages" className="relative inline-flex items-center justify-center rounded-[12px] border border-border bg-surface p-2.5 text-text2 transition hover:border-[#5B5EF7]/50 hover:text-text">
                <MessageSquare size={18} />
                {totalUnread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red text-[10px] font-semibold text-white px-1.5">
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </Link>
              <button className="relative inline-flex items-center justify-center rounded-[12px] border border-border bg-surface p-2.5 text-text2 transition hover:border-[#5B5EF7]/50 hover:text-text">
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
              <Link href="/login" className="text-sm font-medium text-text2 transition hover:text-text">Sign In</Link>
              <Link href="/signup" className="rounded-[14px] bg-[#5B5EF7] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(91,94,247,0.25)] transition hover:bg-[#4B4EE8]">Get Started</Link>
            </div>
          )}

          <button className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-border bg-surface text-text2 transition hover:border-[#5B5EF7]/50 hover:text-text md:hidden" onClick={() => setMobileOpen((prev) => !prev)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-page px-4 py-4 backdrop-blur-xl">
          <div className="space-y-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-between rounded-[14px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text2 transition hover:bg-surface2 hover:text-text"
            >
              <span>{mounted && resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
              {mounted && resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-[14px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text2 transition hover:bg-surface2 hover:text-text ${link.href === '/studio' ? 'ai-studio-nav-link' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>{link.label}</span>
                {link.href === '/studio' && <span className="studio-new-badge">NEW</span>}
              </Link>
            ))}
            {user && !isPublicHome ? (
              <>
                <Link href="/messages" className="block rounded-[14px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text2 transition hover:bg-surface2 hover:text-text" onClick={() => setMobileOpen(false)}>
                  Messages
                </Link>
                <button onClick={handleSignOut} className="w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-left text-sm font-medium text-text2 transition hover:bg-surface2 hover:text-text">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block rounded-[14px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text2 transition hover:bg-surface2 hover:text-text" onClick={() => setMobileOpen(false)}>
                  Sign In
                </Link>
                <Link href="/signup" className="block rounded-[14px] bg-[#5B5EF7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4B4EE8]" onClick={() => setMobileOpen(false)}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
