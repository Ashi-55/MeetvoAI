'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bell,
  Bot,
  Cloud,
  CreditCard,
  Handshake,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Search,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DashboardActions } from '@/components/dashboard/DashboardActions';

const C = {
  page: '#0B1020',
  sidebar: '#111827',
  card: '#131A2A',
  border: '#1B2540',
  blue: '#00C2A8',
  blueHover: '#5B5EF7',
  purple: '#5B5EF7',
  success: '#22C55E',
  warning: '#F6AD55',
  error: '#EF4444',
  white: '#FFFFFF',
  gray: '#A8B3CF',
};

type Profile = { id?: string; full_name?: string | null; email?: string | null; current_mode?: string | null; role?: string | null };
type Deal = {
  id: string;
  project_name?: string | null;
  title?: string | null;
  amount?: number | null;
  deal_value?: number | null;
  status?: string | null;
  conversation_id?: string | null;
  profiles?: { full_name?: string | null; avatar_url?: string | null } | null;
};
type Conversation = {
  id: string;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count?: number | null;
  buyer_unread?: number | null;
  profiles?: { full_name?: string | null } | null;
};
type DeployedAgent = {
  id: string;
  name?: string | null;
  subdomain?: string | null;
  deployment_url?: string | null;
  url?: string | null;
  agent_type?: string | null;
  type?: string | null;
  status?: string | null;
  request_count?: number | null;
};

function money(value: number) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
}

function firstName(profile: Profile | null) {
  return profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there';
}

function initials(name?: string | null) {
  return (name || 'User').trim().charAt(0).toUpperCase() || 'U';
}

function timeAgo(value?: string | null) {
  if (!value) return '';
  const mins = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getAmount(deal: Deal) {
  return Number(deal.amount ?? deal.deal_value ?? 0);
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function Sidebar({
  profile,
  email,
  plan,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  profile: Profile | null;
  email: string;
  plan: string;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sections = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'AI Automation',
      items: [
        { label: 'AI Studio', href: '/studio', icon: Bot },
        { label: 'My Agents', href: '/dashboard/agents', icon: Rocket },
        { label: 'Deployed Agents', href: '/dashboard/deployed', icon: Cloud },
      ],
    },
    {
      label: 'Marketplace',
      items: [
        { label: 'Browse Builders', href: '/marketplace', icon: Search },
        { label: 'Conversations', href: '/messages', icon: MessageSquare },
        { label: 'My Deals', href: '/dashboard/deals', icon: Handshake },
      ],
    },
    {
      label: 'Account',
      items: [
        { label: 'Subscription', href: '/pricing', icon: CreditCard },
        { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {open && <button className="dash-overlay" onClick={onClose} aria-label="Close dashboard menu" />}
      <aside className={`dash-sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="side-top">
          <div className="logo-row">
            <div className="logo-text"><span>Meetvo</span><strong>AI</strong></div>
            <button
              className="desktop-collapse"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <button className="mobile-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
          </div>
          <div className="user-row">
            <div className="avatar">{initials(profile?.full_name || email)}</div>
            <div className="min-w-0">
              <div className="user-name">{profile?.full_name || firstName(profile)}</div>
              <div className="role-text">Business Account</div>
            </div>
          </div>
        </div>
        <nav className="side-nav">
          {sections.map((section) => (
            <div key={section.label} className="nav-section">
              <div className="section-label">{section.label}</div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${active ? 'active' : ''} ${item.href === '/studio' ? 'ai-studio-nav-link' : ''}`}
                    onClick={onClose}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                    {item.href === '/studio' && <span className="studio-new-badge">NEW</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="email-line">{email}</div>
          {plan === 'free' && (
            <button className="upgrade-soft" onClick={() => router.push('/pricing')}>⚡ Upgrade Plan</button>
          )}
        </div>
      </aside>
    </>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string | number;
  trend: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-label">{label}</div>
        <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-trend">{trend}</div>
    </div>
  );
}

function statusMeta(status?: string | null) {
  if (status === 'payment_pending') return { text: 'Awaiting Payment', bg: '#F6AD5520', color: C.warning, border: '#F6AD5540' };
  if (status === 'in_progress') return { text: 'In Progress', bg: '#00C2A820', color: C.blue, border: '#00C2A840' };
  if (status === 'submitted') return { text: 'Review Needed', bg: '#F6AD5520', color: C.warning, border: '#F6AD5540' };
  if (status === 'completed') return { text: 'Completed', bg: '#22C55E20', color: C.success, border: '#22C55E40' };
  if (status === 'disputed') return { text: 'Disputed', bg: '#EF444420', color: C.error, border: '#EF444440' };
  return { text: 'Open', bg: '#1B2540', color: C.gray, border: C.border };
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('free');
  const [buildsUsed, setBuildsUsed] = useState(0);
  const [agentsLimit, setAgentsLimit] = useState(1);
  const [buildLimit, setBuildLimit] = useState(1);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<DeployedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [approving, setApproving] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setEmail(user.email || '');

      const [profileResult, businessResult, dealsResult, completedDealsResult, convsResult, agentsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('business_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('deals')
          .select('*, profiles!deals_builder_id_fkey(full_name, avatar_url)')
          .eq('business_id', user.id)
          .in('status', ['payment_pending', 'in_progress', 'submitted'])
          .order('created_at', { ascending: false }),
        supabase.from('deals').select('amount, deal_value').eq('business_id', user.id).eq('status', 'completed'),
        supabase
          .from('conversations')
          .select('*, profiles!conversations_builder_id_fkey(full_name)')
          .eq('business_id', user.id)
          .order('last_message_at', { ascending: false })
          .limit(5),
        supabase.from('deployed_agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      setProfile(profileResult.data || { full_name: user.email?.split('@')[0], email: user.email });
      const b = (businessResult.data || {}) as any;
      const nextPlan = String(b.subscription_plan || 'free').toLowerCase();
      setPlan(nextPlan);
      setBuildsUsed(Number(b.studio_builds_used || 0));
      setBuildLimit(nextPlan === 'free' ? 1 : nextPlan === 'starter' ? 10 : 999);
      setAgentsLimit(nextPlan === 'free' ? 1 : nextPlan === 'starter' ? 3 : nextPlan === 'growth' ? 10 : 999);
      setDeals([...(dealsResult.data || []), ...(completedDealsResult.data || []).map((d: any, i: number) => ({ ...d, id: `completed-${i}`, status: 'completed' }))] as Deal[]);
      setConversations((convsResult.data || []) as Conversation[]);
      setAgents((agentsResult.data || []) as DeployedAgent[]);
      setLoading(false);
    }
    loadDashboard();
  }, [router]);

  const activeDeals = deals.filter((deal) => ['payment_pending', 'in_progress', 'submitted'].includes(String(deal.status)));
  const completedSpend = deals.filter((deal) => deal.status === 'completed').reduce((sum, deal) => sum + getAmount(deal), 0);
  const deployedCount = agents.length;

  const planLabel = plan === 'pro' ? 'Pro' : plan === 'growth' ? 'Growth' : plan === 'starter' ? 'Starter' : 'Free';
  const usedAgents = deployedCount;
  const agentPercent = agentsLimit >= 999 ? 100 : Math.min((usedAgents / Math.max(agentsLimit, 1)) * 100, 100);
  const buildPercent = buildLimit >= 999 ? 100 : Math.min((buildsUsed / Math.max(buildLimit, 1)) * 100, 100);

  async function approveDeal(id: string) {
    setApproving(id);
    const supabase = createClient();
    await supabase.from('deals').update({ status: 'completed' }).eq('id', id);
    setDeals((current) => current.map((deal) => deal.id === id ? { ...deal, status: 'completed' } : deal));
    setApproving('');
  }

  function quickBuild() {
    if (!quickPrompt.trim()) return router.push('/studio');
    router.push(`/studio?prompt=${encodeURIComponent(quickPrompt.trim())}`);
  }

  return (
    <div className="dash-shell">
      <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open dashboard menu"><Menu size={20} /></button>
      <Sidebar
        profile={profile}
        email={email}
        plan={plan}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />
      <main className="dash-main">
        <div className="topbar">
          <div>
            <h1>Good morning, {firstName(profile)} 👋</h1>
            <p>Here's what's happening with your AI automation.</p>
          </div>
          <DashboardActions />
        </div>

        <div className="stats-grid">
          {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="stat-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-5 h-8 w-20" /></div>) : (
            <>
              <StatCard label="Active Deals" value={activeDeals.length} icon={<Handshake size={18} />} iconBg="#00C2A820" iconColor={C.blue} trend="Active right now" />
              <StatCard label="Deployed Agents" value={deployedCount} icon={<Bot size={18} />} iconBg="#5B5EF720" iconColor={C.purple} trend="Running 24/7" />
              <StatCard label="Total Spent" value={money(completedSpend)} icon={<IndianRupee size={18} />} iconBg="#22C55E20" iconColor={C.success} trend="Across all deals" />
              <StatCard label="Builders Messaged" value={conversations.length} icon={<Users size={18} />} iconBg="#F6AD5520" iconColor={C.warning} trend="Total conversations" />
            </>
          )}
        </div>

        <div className="middle-grid">
          <section className="panel">
            <div className="panel-head">
              <div><h2>🤖 Quick Build</h2><p>Generate an AI agent instantly</p></div>
              <button className="text-action" onClick={() => router.push('/studio')}>Open Full Studio →</button>
            </div>
            <textarea className="quick-textarea" value={quickPrompt} onChange={(e) => setQuickPrompt(e.target.value)} placeholder={'Describe what you want to build...\ne.g. WhatsApp bot for my restaurant'} />
            <div className="chips">
              {['WhatsApp Bot', 'Booking Site', 'Lead Gen', 'Support Agent'].map((chip) => <button key={chip} onClick={() => setQuickPrompt(chip)}>{chip}</button>)}
            </div>
            <button className="full-primary" onClick={quickBuild}>Build with AI →</button>
          </section>

          <section className="panel">
            <div className="eyebrow">My Plan</div>
            <div className={`plan-name ${plan === 'pro' ? 'purple' : ''}`}>{planLabel}{plan === 'starter' ? ' ✦' : plan === 'growth' ? ' ⚡' : plan === 'pro' ? ' 👑' : ''}</div>
            <div className="divider" />
            <Usage label="Studio Builds" used={buildsUsed} limit={buildLimit} percent={buildPercent} />
            <Usage label="Deployed Agents" used={usedAgents} limit={agentsLimit} percent={agentPercent} />
            <button className="upgrade-gradient" onClick={() => router.push('/pricing')}>Upgrade Plan →</button>
            <p className="small-note">Unlock more builds and agents</p>
          </section>
        </div>

        <section className="panel table-panel">
          <div className="table-head"><h2>Active Deals</h2><button onClick={() => router.push('/dashboard/deals')}>View All →</button></div>
          <table>
            <thead><tr>{['Builder', 'Project', 'Amount', 'Status', 'Action'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? Array.from({ length: 3 }).map((_, r) => <tr key={r}>{Array.from({ length: 5 }).map((__, c) => <td key={c}><Skeleton className="h-4 w-24" /></td>)}</tr>) : activeDeals.length ? activeDeals.map((deal) => {
                const meta = statusMeta(deal.status);
                const name = deal.profiles?.full_name || 'Builder';
                return (
                  <tr key={deal.id}>
                    <td><div className="person"><span>{initials(name)}</span><strong>{name}</strong></div></td>
                    <td className="muted truncate-cell">{deal.project_name || deal.title || 'AI automation project'}</td>
                    <td className="amount">{money(getAmount(deal))}</td>
                    <td><span className="badge" style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>{meta.text}</span></td>
                    <td>{deal.status === 'submitted' ? <button className="approve-btn" disabled={approving === deal.id} onClick={() => approveDeal(deal.id)}>{approving === deal.id ? '...' : 'Approve ✓'}</button> : <button className="outline-btn" onClick={() => router.push(`/messages?conversation=${deal.conversation_id || ''}`)}>Open Chat</button>}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={5}><Empty icon={<Handshake size={28} />} title="No active deals yet" text="Browse marketplace to find builders" action="Browse Marketplace →" onClick={() => router.push('/marketplace')} /></td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="table-head"><h2>My Deployed Agents</h2><button className="mini-primary" onClick={() => router.push('/studio')}>+ Deploy New</button></div>
          {loading ? <div className="agent-grid">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="agent-card"><Skeleton className="h-5 w-20" /><Skeleton className="mt-5 h-4 w-28" /></div>)}</div> : agents.length ? (
            <div className="agent-grid">
              {agents.map((agent) => {
                const url = agent.deployment_url || agent.url || (agent.subdomain ? `https://${agent.subdomain}.meetvoai.in` : '');
                const live = agent.status !== 'offline';
                return (
                  <div key={agent.id} className="agent-card">
                    <div className="agent-top"><span className="agent-emoji">{agent.agent_type === 'website' || agent.type === 'website' ? '🌐' : '🤖'}</span><span className={`live-state ${live ? 'on' : ''}`}><i />{live ? 'Live' : 'Offline'}</span></div>
                    <h3>{agent.name || 'MeetvoAI Agent'}</h3>
                    {url && <button className="agent-url" onClick={() => window.open(url, '_blank')}>{url.replace(/^https?:\/\//, '')}</button>}
                    <p>Requests: {agent.request_count || 0}</p>
                    <div className="agent-actions"><button onClick={() => url && window.open(url, '_blank')}>Open ↗</button><button>Settings</button></div>
                  </div>
                );
              })}
            </div>
          ) : <Empty title="No agents deployed yet" text="Use AI Studio to build and deploy your first agent" action="Open AI Studio →" onClick={() => router.push('/studio')} />}
        </section>

        <section className="panel table-panel">
          <div className="table-head"><h2>Recent Conversations</h2><button onClick={() => router.push('/messages')}>View All →</button></div>
          {loading ? <div className="conversation-list">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="conv-row"><Skeleton className="h-10 w-10 rounded-full" /><div><Skeleton className="h-4 w-32" /><Skeleton className="mt-2 h-3 w-52" /></div></div>)}</div> : conversations.length ? (
            <div className="conversation-list">
              {conversations.map((conv) => {
                const name = conv.profiles?.full_name || 'Builder';
                const unread = conv.unread_count ?? conv.buyer_unread ?? 0;
                return (
                  <button key={conv.id} className="conv-row" onClick={() => router.push(`/messages?conversation=${conv.id}`)}>
                    <span className="conv-avatar">{initials(name)}</span>
                    <span className="conv-content"><strong>{name}</strong><small>{(conv.last_message || 'Open conversation').slice(0, 50)}</small></span>
                    <span className="conv-right"><small>{timeAgo(conv.last_message_at)}</small>{unread > 0 && <b>{unread}</b>}</span>
                  </button>
                );
              })}
            </div>
          ) : <Empty title="No conversations yet" text="Message a builder from the marketplace" action="Browse Marketplace →" onClick={() => router.push('/marketplace')} />}
        </section>
      </main>
      <DashboardStyles />
    </div>
  );
}

function Usage({ label, used, limit, percent }: { label: string; used: number; limit: number; percent: number }) {
  return (
    <div className="usage">
      <div>{label}</div>
      <span>{used}/{limit >= 999 ? '∞' : limit} used</span>
      <div className="progress"><i style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function Empty({ icon, title, text, action, onClick }: { icon?: ReactNode; title: string; text: string; action?: string; onClick?: () => void }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{text}</p>
      {action && <button className="primary-btn" onClick={onClick}>{action}</button>}
    </div>
  );
}

function DashboardStyles() {
  return (
    <style jsx global>{`
      .dash-shell{display:flex;height:100vh;overflow:hidden;background:${C.page};color:white}
      .dash-sidebar{width:240px;flex-shrink:0;background:${C.sidebar};border-right:1px solid ${C.border};height:100vh;display:flex;flex-direction:column;overflow-y:auto;transition:width .2s ease}
      .desktop-collapse{display:flex;width:30px;height:30px;flex-shrink:0;align-items:center;justify-content:center;border:1px solid ${C.border};border-radius:8px;background:${C.card};color:${C.blue};cursor:pointer}.desktop-collapse:hover{border-color:${C.blue};color:white}.dash-sidebar.collapsed{width:76px}.dash-sidebar.collapsed .logo-text,.dash-sidebar.collapsed .user-row .min-w-0,.dash-sidebar.collapsed .section-label,.dash-sidebar.collapsed .nav-item span,.dash-sidebar.collapsed .side-bottom{display:none}.dash-sidebar.collapsed .side-top{padding:18px 12px}.dash-sidebar.collapsed .logo-row,.dash-sidebar.collapsed .user-row{justify-content:center}.dash-sidebar.collapsed .nav-item{justify-content:center;padding:12px 0}.dash-sidebar.collapsed .nav-item.active:before{width:3px}.dash-sidebar.collapsed .avatar{width:36px;height:36px}
      .side-top{padding:20px 18px;border-bottom:1px solid ${C.border}}.logo-row,.user-row{display:flex;align-items:center;gap:10px}.logo-row{justify-content:space-between}.logo-text{min-width:0;font-size:22px;font-weight:900;letter-spacing:-.04em;white-space:nowrap}.logo-text strong{color:${C.blue}}.user-row{margin-top:16px}.avatar,.person span,.conv-avatar{background:linear-gradient(135deg,${C.blue},${C.purple});color:white;font-weight:800;border-radius:50%;display:flex;align-items:center;justify-content:center}.avatar{width:36px;height:36px;flex-shrink:0}.user-name{font-size:14px;font-weight:600}.role-text{color:${C.gray};font-size:11px;margin-top:2px}.side-nav{flex:1;padding:8px 0}.section-label{padding:16px 18px 6px;color:${C.gray};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}.nav-item{display:flex;align-items:center;gap:10px;padding:10px 18px;color:${C.gray};font-size:14px;font-weight:500;position:relative;transition:all .15s;text-decoration:none}.nav-item:hover{background:${C.border};color:white}.nav-item.active{background:rgba(0,194,168,.12);color:${C.blue};font-weight:600}.nav-item.active:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:${C.blue};border-radius:0 2px 2px 0}.side-bottom{border-top:1px solid ${C.border};padding:16px 18px}.email-line{color:${C.gray};font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.upgrade-soft{margin-top:8px;width:100%;background:rgba(0,194,168,.1);border:1px solid rgba(0,194,168,.32);color:${C.blue};border-radius:8px;padding:8px;font-size:12px;font-weight:600}
      .dash-main{flex:1;overflow-y:auto;padding:32px;background:${C.page}}.topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px}.topbar h1{font-size:26px;font-weight:800;margin:0}.topbar p{color:${C.gray};font-size:14px;margin:4px 0 0}.primary-btn,.full-primary,.mini-primary{background:${C.blue};color:#0B1020;border:0;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}.primary-btn{padding:10px 16px}.primary-btn:hover,.full-primary:hover,.mini-primary:hover{background:${C.blueHover};color:white}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.stat-card,.panel{background:${C.card};border:1px solid ${C.border};border-radius:16px}.stat-card{padding:20px 22px}.stat-top{display:flex;justify-content:space-between;align-items:flex-start}.stat-label,.muted{color:${C.gray}}.stat-label{font-size:13px}.stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center}.stat-value{font-size:30px;font-weight:800;margin-top:12px;margin-bottom:6px}.stat-trend{font-size:12px;color:${C.gray}}.middle-grid{display:grid;grid-template-columns:1fr 380px;gap:20px;margin-bottom:24px}.panel{padding:22px;margin-bottom:24px}.panel-head,.table-head{display:flex;justify-content:space-between;align-items:center;gap:14px}.panel h2,.table-head h2{font-size:16px;font-weight:700;margin:0}.panel p{color:${C.gray};font-size:12px;margin:3px 0 0}.text-action,.table-head button{background:transparent;border:1px solid ${C.border};color:${C.gray};border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer}.text-action{border:0;color:${C.blue};padding:0}.table-head button:hover{border-color:${C.blue};color:${C.blue}}.quick-textarea{width:100%;height:90px;margin-top:16px;background:${C.page};border:1px solid ${C.border};border-radius:10px;padding:14px 16px;color:white;font-size:14px;resize:none;outline:none;font-family:inherit}.quick-textarea:focus{border-color:${C.blue};box-shadow:0 0 0 3px rgba(0,194,168,.1)}.chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.chips button{background:${C.border};color:${C.gray};border:1px solid rgba(0,194,168,.16);border-radius:100px;padding:5px 12px;font-size:11px}.chips button:hover{border-color:${C.blue};color:${C.blue}}.full-primary{padding:10px 18px;margin-top:14px}.eyebrow{color:${C.gray};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.plan-name{font-size:22px;font-weight:800;margin-top:8px}.plan-name.purple{color:${C.purple}}.divider{height:1px;background:${C.border};margin:16px 0}.usage{margin-top:12px}.usage div:first-child{color:${C.gray};font-size:12px}.usage span{display:block;color:white;font-size:12px;margin-top:4px}.progress{height:6px;background:${C.border};border-radius:100px;overflow:hidden;margin-top:6px}.progress i{display:block;height:100%;background:${C.blue};border-radius:100px}.upgrade-gradient{margin-top:16px;background:linear-gradient(135deg,${C.blue},${C.purple});color:white;border:0;border-radius:10px;padding:10px 18px;font-size:13px;font-weight:800}.small-note{text-align:left!important;margin-top:8px!important;font-size:11px!important}.table-panel{padding:0;overflow:hidden}.table-head{padding:18px 22px;border-bottom:1px solid ${C.border}}table{width:100%;border-collapse:collapse}thead{background:${C.page}}th{padding:10px 22px;color:${C.gray};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;text-align:left;border-bottom:1px solid ${C.border}}td{padding:14px 22px;border-bottom:1px solid rgba(30,27,58,.75)}tr:hover td{background:rgba(0,194,168,.08)}.person{display:flex;align-items:center;gap:10px}.person span{width:30px;height:30px;font-size:12px}.person strong{font-size:14px}.amount{color:${C.blue};font-weight:700}.truncate-cell{max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.badge{display:inline-flex;border:1px solid;border-radius:100px;padding:3px 10px;font-size:11px;font-weight:600;white-space:nowrap}.approve-btn,.outline-btn{border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer}.approve-btn{background:#22C55E20;border:1px solid ${C.success};color:${C.success};font-weight:600}.outline-btn{background:transparent;border:1px solid ${C.border};color:${C.gray}}.outline-btn:hover{border-color:${C.blue};color:${C.blue}}.empty-state{text-align:center;padding:40px 22px}.empty-icon{width:60px;height:60px;background:rgba(0,194,168,.1);color:${C.blue};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}.empty-state h3{font-size:16px;margin:0;color:white}.empty-state p{font-size:13px;color:${C.gray};margin:6px 0 16px}.agent-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}.agent-card{background:${C.page};border:1px solid ${C.border};border-radius:12px;padding:16px}.agent-card:hover{border-color:${C.blue}}.agent-top{display:flex;justify-content:space-between}.agent-emoji{font-size:22px}.live-state{font-size:11px;color:${C.gray};display:flex;align-items:center;gap:4px}.live-state i{width:8px;height:8px;border-radius:50%;background:${C.gray}}.live-state.on{color:${C.success}}.live-state.on i{background:${C.success};animation:pulse 2s infinite}.agent-card h3{font-size:14px;margin:10px 0 0}.agent-url{background:transparent;border:0;color:${C.blue};font-size:12px;margin-top:4px;padding:0;text-align:left}.agent-card p{color:${C.gray};font-size:11px;margin-top:6px}.agent-actions{display:flex;gap:8px;margin-top:12px}.agent-actions button{flex:1;border-radius:7px;padding:6px;font-size:12px}.agent-actions button:first-child{background:rgba(0,194,168,.1);border:1px solid rgba(0,194,168,.32);color:${C.blue}}.agent-actions button:last-child{background:transparent;border:1px solid ${C.border};color:${C.gray}}.conversation-list{display:flex;flex-direction:column}.conv-row{width:100%;display:flex;align-items:center;gap:12px;padding:14px 22px;border:0;border-bottom:1px solid rgba(30,27,58,.75);background:transparent;text-align:left;cursor:pointer}.conv-row:hover{background:rgba(0,194,168,.08)}.conv-avatar{width:40px;height:40px;font-size:15px;flex-shrink:0}.conv-content{flex:1;min-width:0}.conv-content strong{display:block;color:white;font-size:14px}.conv-content small{display:block;color:${C.gray};font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px}.conv-right{text-align:right}.conv-right small{color:${C.gray};font-size:11px}.conv-right b{display:block;background:${C.blue};color:#0B1020;border-radius:100px;padding:2px 7px;font-size:10px;margin-top:4px}.hamburger,.mobile-close{display:none}.skeleton{background:${C.border};border-radius:8px;animation:pulse 1.7s ease-in-out infinite}.h-4{height:16px}.h-8{height:32px}.h-10{height:40px}.w-10{width:40px}.w-20{width:80px}.w-24{width:96px}.w-28{width:112px}.w-32{width:128px}.w-52{width:208px}.mt-2{margin-top:8px}.mt-5{margin-top:20px}.rounded-full{border-radius:999px}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
      @media(max-width:1100px){.stats-grid{grid-template-columns:repeat(2,1fr)}.middle-grid{grid-template-columns:1fr}.agent-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.hamburger{display:flex;position:fixed;top:16px;left:16px;z-index:60;width:40px;height:40px;align-items:center;justify-content:center;border:1px solid ${C.border};border-radius:10px;background:${C.card};color:white}.desktop-collapse{display:none}.mobile-close{display:flex;margin-left:auto;background:transparent;border:0;color:${C.gray}}.dash-sidebar,.dash-sidebar.collapsed{width:240px;position:fixed;left:0;top:0;z-index:70;transform:translateX(-100%);transition:transform .2s}.dash-sidebar.open{transform:translateX(0)}.dash-sidebar.collapsed .logo-text,.dash-sidebar.collapsed .user-row .min-w-0,.dash-sidebar.collapsed .section-label,.dash-sidebar.collapsed .nav-item span,.dash-sidebar.collapsed .side-bottom{display:block}.dash-sidebar.collapsed .logo-row,.dash-sidebar.collapsed .user-row{justify-content:flex-start}.dash-sidebar.collapsed .nav-item{justify-content:flex-start;padding:10px 18px}.dash-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:65;border:0}.dash-main{padding:72px 16px 24px}.topbar{flex-direction:column}.stats-grid,.agent-grid{grid-template-columns:1fr}table{min-width:720px}.table-panel{overflow-x:auto}}
    `}</style>
  );
}
