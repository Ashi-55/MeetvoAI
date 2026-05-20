'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function DashboardNavbar() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[#1E1B3A] bg-[#0D0B1A]/95 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-6">
        <div className="text-xl font-bold">
          <span className="text-white">Meetvo</span>
          <span className="text-[#ae9bc9]">AI</span>
        </div>
        {user ? (
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-lg border border-[#1E1B3A] bg-[#100F1C] px-4 py-2 text-sm font-medium text-[#8A9BB5] transition hover:border-[#E53E3E] hover:text-[#E53E3E]"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        ) : null}
      </div>
    </div>
  );
}
