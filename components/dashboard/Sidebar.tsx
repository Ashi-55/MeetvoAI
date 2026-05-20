'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  BarChart3,
  Bot,
  Rocket,
  Cloud,
  Search,
  MessageSquare,
  Handshake,
  CreditCard,
  Bell,
  Settings,
  Package,
  Briefcase,
  Star,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  role?: 'business' | 'builder';
  userName?: string;
  userEmail?: string;
  currentPath?: string;
  subscriptionPlan?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  role: propRole,
  userName: propUserName,
  userEmail: propUserEmail,
  currentPath: propCurrentPath,
  subscriptionPlan: propSubscriptionPlan,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, user } = useAuth();

  // Use props if provided, otherwise use auth data
  const role = (propRole || (profile?.current_mode === 'builder' ? 'builder' : 'business')) as 'business' | 'builder';
  const userName = propUserName || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = propUserEmail || user?.email || '';
  const currentPath = propCurrentPath || pathname;
  const subscriptionPlan = propSubscriptionPlan || 'Free';

  const isActive = (href: string) => currentPath === href;

  const navItemClass = (href: string) => {
    const baseClass = 'nav-item';
    const activeClass = role === 'builder' ? 'active-purple' : 'active-blue';
    return `${baseClass} ${isActive(href) ? activeClass : ''}`;
  };

  const sectionLabelColor =
    role === 'builder' ? 'text-purple-400' : 'text-blue-400';

  const accentColor = role === 'builder' ? '#7C5CBF' : '#ae9bc9';
  const accentBgLight = role === 'builder' ? '#7C5CBF15' : '#ae9bc915';
  const accentBorderLight = role === 'builder' ? '#7C5CBF40' : '#ae9bc940';
  const userInitial = userName && userName.length > 0 ? userName[0].toUpperCase() : 'U';

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  return (
    <div
      style={{
        width: '240px',
        flexShrink: 0,
        background: '#0D0B1A',
        borderRight: '1px solid #1E1B3A',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* TOP SECTION */}
      <div
        style={{
          padding: '20px 16px',
          borderBottom: '1px solid #1E1B3A',
        }}
      >
        {/* Logo Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.04em' }}>
            <span style={{ color: 'white' }}>Meetvo</span>
            <span style={{ color: '#ae9bc9' }}>AI</span>
          </div>
        </div>

        {/* User Info */}
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {/* Avatar Circle */}
          <div
            style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #ae9bc9, #7C5CBF)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '15px',
              flexShrink: 0,
            }}
          >
            {userInitial}
          </div>

          {/* Right Side */}
          <div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>
              {userName}
            </div>
            <div
              style={{
                marginTop: '4px',
                background:
                  role === 'business' ? '#ae9bc920' : '#7C5CBF20',
                color: accentColor,
                borderRadius: '100px',
                padding: '2px 8px',
                fontSize: '10px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {role === 'business' ? 'Business Account' : 'Builder Account'}
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 0',
        }}
      >
        {role === 'business' ? (
          <>
            {/* OVERVIEW */}
            <div>
              <div className="section-label">Overview</div>
              <Link
                href="/dashboard"
                className={navItemClass('/dashboard')}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className={navItemClass('/dashboard/analytics')}
              >
                <BarChart3 size={16} />
                <span>Analytics</span>
              </Link>
            </div>

            {/* AI AUTOMATION */}
            <div style={{ marginTop: '16px' }}>
              <div className="section-label">AI Automation</div>
              <Link href="/studio" className={`${navItemClass('/studio')} ai-studio-nav-link`}>
                <Bot size={16} />
                <span>AI Studio</span>
                <span className="studio-new-badge">NEW</span>
              </Link>
              <Link
                href="/dashboard/agents"
                className={navItemClass('/dashboard/agents')}
              >
                <Rocket size={16} />
                <span>My Agents</span>
              </Link>
              <Link
                href="/dashboard/deployed"
                className={navItemClass('/dashboard/deployed')}
              >
                <Cloud size={16} />
                <span>Deployed Agents</span>
              </Link>
            </div>

            {/* MARKETPLACE */}
            <div style={{ marginTop: '16px' }}>
              <div className="section-label">Marketplace</div>
              <Link
                href="/marketplace"
                className={navItemClass('/marketplace')}
              >
                <Search size={16} />
                <span>Browse Builders</span>
              </Link>
              <Link
                href="/messages"
                className={navItemClass('/messages')}
              >
                <MessageSquare size={16} />
                <span>Conversations</span>
              </Link>
              <Link
                href="/dashboard/deals"
                className={navItemClass('/dashboard/deals')}
              >
                <Handshake size={16} />
                <span>My Deals</span>
              </Link>
            </div>

            {/* ACCOUNT */}
            <div style={{ marginTop: '16px' }}>
              <div className="section-label">Account</div>
              <Link
                href="/pricing"
                className={navItemClass('/pricing')}
              >
                <CreditCard size={16} />
                <span>Subscription</span>
              </Link>
              <Link
                href="/dashboard/notifications"
                className={navItemClass('/dashboard/notifications')}
              >
                <Bell size={16} />
                <span>Notifications</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className={navItemClass('/dashboard/settings')}
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* OVERVIEW */}
            <div>
              <div className="section-label">Overview</div>
              <Link
                href="/dashboard/builder"
                className={navItemClass('/dashboard/builder')}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard/builder/earnings"
                className={navItemClass('/dashboard/builder/earnings')}
              >
                <BarChart3 size={16} />
                <span>Earnings</span>
              </Link>
            </div>

            {/* MY WORK */}
            <div style={{ marginTop: '16px' }}>
              <div className="section-label">My Work</div>
              <Link href="/studio" className={`${navItemClass('/studio')} ai-studio-nav-link`}>
                <Zap size={16} />
                <span>AI Studio</span>
                <span className="studio-new-badge">NEW</span>
              </Link>
              <Link
                href="/dashboard/builder/agents"
                className={navItemClass('/dashboard/builder/agents')}
              >
                <Package size={16} />
                <span>My Agents</span>
              </Link>
              <Link
                href="/dashboard/builder/deals"
                className={navItemClass('/dashboard/builder/deals')}
              >
                <Briefcase size={16} />
                <span>Active Deals</span>
              </Link>
              <Link
                href="/messages"
                className={navItemClass('/messages')}
              >
                <MessageSquare size={16} />
                <span>Messages</span>
              </Link>
            </div>

            {/* MARKETPLACE */}
            <div style={{ marginTop: '16px' }}>
              <div className="section-label">Marketplace</div>
              <Link
                href="/marketplace"
                className={navItemClass('/marketplace')}
              >
                <Search size={16} />
                <span>Browse Businesses</span>
              </Link>
            </div>

            {/* ACCOUNT */}
            <div style={{ marginTop: '16px' }}>
              <div className="section-label">Account</div>
              <Link
                href="/pricing"
                className={navItemClass('/pricing')}
              >
                <CreditCard size={16} />
                <span>Subscription</span>
              </Link>
              <Link
                href="/dashboard/builder/reviews"
                className={navItemClass('/dashboard/builder/reviews')}
              >
                <Star size={16} />
                <span>My Reviews</span>
              </Link>
              <Link
                href="/dashboard/builder/settings"
                className={navItemClass('/dashboard/builder/settings')}
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </div>
          </>
        )}
      </nav>

      {/* BOTTOM SECTION */}
      <div
        style={{
          borderTop: '1px solid #1E1B3A',
          padding: '16px',
        }}
      >
        <div
          style={{
            color: '#8A9BB5',
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {userEmail}
        </div>

        {subscriptionPlan === 'free' && (
          <button
            onClick={handleUpgradeClick}
            style={{
              marginTop: '8px',
              width: '100%',
              background: accentBgLight,
              border: `1px solid ${accentBorderLight}`,
              color: accentColor,
              borderRadius: '8px',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = accentColor + '25';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = accentBgLight;
            }}
          >
            ⚡ Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
