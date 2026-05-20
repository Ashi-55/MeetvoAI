'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { AvatarDropdown } from '@/components/navbar/AvatarDropdown';

export function DashboardActions() {
  const router = useRouter();
  const { profile } = useAuth();
  const { totalUnread } = useChatStore();
  const { unreadCount } = useNotificationStore();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      <div className="dashboard-actions" aria-label="Dashboard actions">
        <Link href="/messages" className="dashboard-action-btn" aria-label="Messages">
          <MessageSquare size={19} />
          {totalUnread > 0 && <span>{totalUnread > 9 ? '9+' : totalUnread}</span>}
        </Link>
        <Link href="/dashboard/notifications" className="dashboard-action-btn" aria-label="Notifications">
          <Bell size={19} />
          {unreadCount > 0 && <span>{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </Link>
        <AvatarDropdown profile={profile} onSignOut={handleSignOut} />
      </div>
      <style jsx global>{`
        .dashboard-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .dashboard-action-btn {
          position: relative;
          display: inline-flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          border: 1px solid #1E1B3A;
          border-radius: 15px;
          background: #100F1C;
          color: #9490B5;
          transition: border-color .15s ease, color .15s ease, background .15s ease;
        }
        .dashboard-action-btn:hover {
          border-color: #7C5CFC;
          color: #fff;
          background: #141225;
        }
        .dashboard-action-btn span {
          position: absolute;
          right: -5px;
          top: -6px;
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #E53E3E;
          color: white;
          font-size: 10px;
          font-weight: 800;
          line-height: 18px;
          text-align: center;
          padding: 0 5px;
        }
        .dashboard-actions > .relative > button {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: #7C3DFF;
          font-size: 14px;
        }
        @media (max-width: 760px) {
          .dashboard-actions {
            margin-left: auto;
          }
        }
      `}</style>
    </>
  );
}
