'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Package, Settings, CreditCard, LogOut, RefreshCw } from 'lucide-react';
import type { Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  profile: Profile | null;
  onSignOut: () => void;
}

export function AvatarDropdown({ profile, onSignOut }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const setProfile = useAuthStore((s) => s.setProfile);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function switchMode() {
    if (!profile) return;
    const supabase = createClient();
    const newMode = profile.current_mode === 'buyer' ? 'builder' : 'buyer';
    await supabase.from('profiles').update({ current_mode: newMode }).eq('id', profile.id);
    setProfile({ ...profile, current_mode: newMode });
    setOpen(false);
    router.refresh();
  }

  const initials = profile?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-bold hover:bg-brand2 transition-colors">
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 bg-surface border border-border rounded-xl shadow-2xl shadow-black/50 py-1 z-50">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-text font-semibold text-sm truncate">{profile?.full_name}</p>
            <p className="text-text3 text-xs truncate">{profile?.email}</p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${profile?.current_mode === 'builder' ? 'bg-brand/20 text-brand' : 'bg-blue/20 text-blue'}`}>
              {profile?.current_mode === 'builder' ? 'Builder' : 'Buyer'}
            </span>
          </div>
          {[
            { href: '/settings', icon: User, label: 'Profile' },
            { href: '/orders', icon: Package, label: 'Orders' },
            { href: '/settings', icon: Settings, label: 'Settings' },
            { href: '/settings', icon: CreditCard, label: 'Payments' },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={label} href={href} onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-text2 hover:text-text hover:bg-surface2 transition-colors text-sm">
              <Icon size={15} /> {label}
            </Link>
          ))}
          <button onClick={switchMode} className="w-full flex items-center gap-3 px-4 py-2.5 text-text2 hover:text-text hover:bg-surface2 transition-colors text-sm">
            <RefreshCw size={15} />
            {profile?.current_mode === 'buyer' ? 'Switch to Selling' : 'Switch to Buying'}
          </button>
          <div className="border-t border-border mt-1">
            <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-red hover:bg-surface2 transition-colors text-sm">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
