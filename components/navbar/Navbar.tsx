'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Bell, Menu, X } from 'lucide-react';
import { MeetvoLogo } from '@/components/ui/HandshakeLogo';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { AvatarDropdown } from './AvatarDropdown';
import { SearchBar } from './SearchBar';
import { createClient } from '@/lib/supabase/client';

export function Navbar() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { totalUnread } = useChatStore();
  const { unreadCount } = useNotificationStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface border-b border-border z-50 flex items-center px-4 gap-4">
      <Link href="/" className="shrink-0">
        <MeetvoLogo size="sm" />
      </Link>

      <div className="flex-1 max-w-xl hidden md:block">
        <SearchBar />
      </div>

      {user ? (
        <div className="flex items-center gap-1 ml-auto">
          <Link href="/messages" className="relative p-2 rounded-lg hover:bg-surface2 transition-colors text-text2 hover:text-text">
            <MessageSquare size={20} />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red rounded-full text-xs text-white flex items-center justify-center font-bold">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </Link>
          <button className="relative p-2 rounded-lg hover:bg-surface2 transition-colors text-text2 hover:text-text">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red rounded-full text-xs text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AvatarDropdown profile={profile} onSignOut={handleSignOut} />
        </div>
      ) : (
        <div className="flex items-center gap-2 ml-auto">
          <Link href="/login" className="text-text2 hover:text-text px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">Login</Link>
          <Link href="/signup" className="bg-brand hover:bg-brand2 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">Sign up</Link>
        </div>
      )}

      <button className="md:hidden ml-1 p-2 text-text2" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-surface border-b border-border p-4 md:hidden">
          <SearchBar />
          {user && (
            <div className="mt-3 space-y-1">
              <Link href="/messages" className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface2 text-text2" onClick={() => setMobileOpen(false)}>
                <MessageSquare size={18} /> Messages
              </Link>
              <Link href="/orders" className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface2 text-text2" onClick={() => setMobileOpen(false)}>Orders</Link>
              <Link href="/settings" className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface2 text-text2" onClick={() => setMobileOpen(false)}>Settings</Link>
              <button onClick={handleSignOut} className="w-full text-left flex items-center gap-2 p-2 rounded-lg hover:bg-surface2 text-red">Sign out</button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
