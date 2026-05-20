'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Bot,
  Briefcase,
  CreditCard,
  Flame,
  IndianRupee,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  Star,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DashboardActions } from '@/components/dashboard/DashboardActions';

const C = {
  page: '#08080F',
  sidebar: '#0D0B1A',
  card: '#100F1C',
  border: '#1E1B3A',
  blue: '#ae9bc9',
  blueHover: '#7C5CFC',
  purple: '#7C5CFC',
  purpleHover: '#6F4EEA',
  success: '#68D391',
  warning: '#F6AD55',
  error: '#E53E3E',
  gray: '#8A9BB5',
};

type Profile = { id?: string; full_name?: string | null; email?: string | null; role?: string | null; current_mode?: string | null };
type BuilderProfile = { subscription_plan?: string | null; published_agents_count?: number | null; avg_rating?: number | null; total_reviews?: number | null };
type Deal = { id: string; amount?: number | null; builder_payout?: number | null; status?: string | null; conversation_id?: string | null; business_name?: string | null; profiles?: { full_name?: string | null } | null };
type Agent = { id: string; name?: string | null; category?: string | null; price?: number | null; price_monthly?: number | null; price_one_time?: number | null; status?: string | null; sales?: number | null; orders?: number | null; pricing_model?: string | null };

const needs = [
  ['🤖 WhatsApp Bots', '38'],
  ['🏥 Clinic Booking', '24'],
  ['🏠 Real Estate Leads', '19'],
  ['🛒 E-commerce Bots', '17'],
  ['📚 Education Systems', '12'],
];

const earnings = [
  ['Jan', 20, '₹2k'],
  ['Feb', 38, '₹4k'],
  ['Mar', 54, '₹7k'],
  ['Apr', 35, '₹3k'],
  ['May', 78, '₹10k'],
  ['Jun', 46, '₹5k'],
];

function money(value: number) {
  return `₹${Math.round(value || 0).toLocaleString('en-IN')}`;
}

function initials(name?: string | null) {
  return (name || 'User').trim().charAt(0).toUpperCase() || 'U';
}

function firstName(profile: Profile | null) {
  return profile?.full_name?.split(' ')[0] || profile?.email?.split('@')[0] || 'there';
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function Sidebar({ profile, email, plan, open, onClose }: { profile: Profile | null; email: string; plan: string; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const sections = [
    { label: 'Overview', items: [{ label: 'Dashboard', href: '/dashboard/builder', icon: LayoutDashboard }, { label: 'Earnings Analytics', href: '/dashboard/builder/earnings', icon: BarChart3 }] },
    { label: 'My Work', items: [{ label: 'AI Studio', href: '/studio', icon: Zap }, { label: 'My Agents', href: '/dashboard/builder/agents', icon: Package }, { label: 'Active Deals', href: '/dashboard/builder/deals', icon: Briefcase }, { label: 'Messages', href: '/messages', icon: MessageSquare }] },
    { label: 'Marketplace', items: [{ label: 'Browse Businesses', href: '/marketplace', icon: Search }, { label: 'Trending Needs', href: '/marketplace', icon: TrendingUp }] },
    { label: 'Account', items: [{ label: 'Subscription', href: '/pricing', icon: CreditCard }, { label: 'My Reviews', href: '/dashboard/builder/reviews', icon: Star }, { label: 'Settings', href: '/dashboard/builder/settings', icon: Settings }] },
  ];
  return (
    <>
      {open && <button className="dash-overlay" onClick={onClose} aria-label="Close dashboard menu" />}
      <aside className={`dash-sidebar builder ${open ? 'open' : ''}`}>
        <div className="side-top">
          <div className="logo-row">
            <div className="logo-text"><span>Meetvo</span><strong>AI</strong></div>
            <button className="mobile-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
          </div>
          <div className="user-row">
            <div className="avatar">{initials(profile?.full_name || email)}</div>
            <div className="min-w-0">
              <div className="user-name">{profile?.full_name || firstName(profile)}</div>
              <div className="role-pill">Builder Account</div>
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
          {plan === 'free' && <button className="upgrade-soft" onClick={() => router.push('/pricing')}>⚡ Upgrade Plan</button>}
        </div>
      </aside>
    </>
  );
}

function StatCard({ label, value, trend, icon, iconBg, iconColor }: { label: string; value: string | number; trend: string; icon: ReactNode; iconBg: string; iconColor: string }) {
  return (
    <div className="stat-card">
      <div className="stat-top"><div className="stat-label">{label}</div><div className="stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div></div>
      <div className="stat-value">{value}</div>
      <div className="stat-trend">{trend}</div>
    </div>
  );
}

function statusMeta(status?: string | null) {
  if (status === 'in_progress') return { label: 'In Progress', bg: '#ae9bc920', color: C.blue, border: '#ae9bc940' };
  if (status === 'payment_pending') return { label: 'Awaiting Payment', bg: '#F6AD5520', color: C.warning, border: '#F6AD5540' };
  if (status === 'submitted') return { label: 'Review Needed', bg: '#F6AD5520', color: C.warning, border: '#F6AD5540' };
  if (status === 'completed') return { label: 'Completed', bg: '#68D39120', color: C.success, border: '#68D39140' };
  return { label: 'Open', bg: '#1E1B3A', color: C.gray, border: C.border };
}

function categoryMeta(category?: string | null) {
  const c = String(category || '').toLowerCase();
  if (c.includes('whatsapp')) return { label: 'WhatsApp', bg: '#25D36620', color: '#25D366' };
  if (c.includes('lead')) return { label: 'Lead Gen', bg: '#ae9bc920', color: C.blue };
  if (c.includes('booking')) return { label: 'Booking', bg: '#F6AD5520', color: C.warning };
  if (c.includes('support')) return { label: 'Support', bg: '#7C5CBF20', color: C.purple };
  if (c.includes('website')) return { label: 'Website', bg: '#68D39120', color: C.success };
  return { label: category || 'Other', bg: '#1E1B3A', color: C.gray };
}

export default function BuilderDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [builderProfile, setBuilderProfile] = useState<BuilderProfile | null>(null);
  const [email, setEmail] = useState('');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [completedDeals, setCompletedDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deliveryDeal, setDeliveryDeal] = useState<Deal | null>(null);
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [savingDelivery, setSavingDelivery] = useState(false);

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

      const [profileResult, builderResult, dealsResult, completedResult, agentsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('builder_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase
          .from('deals')
          .select('*, profiles!deals_business_id_fkey(full_name)')
          .eq('builder_id', user.id)
          .in('status', ['payment_pending', 'in_progress', 'submitted'])
          .order('created_at', { ascending: false }),
        supabase.from('deals').select('*').eq('builder_id', user.id).eq('status', 'completed'),
        supabase.from('agents').select('*').eq('builder_id', user.id).order('created_at', { ascending: false }),
      ]);

      setProfile(profileResult.data || { full_name: user.email?.split('@')[0], email: user.email });
      setBuilderProfile(builderResult.data || {});
      setDeals((dealsResult.data || []).map((deal: any) => ({ ...deal, business_name: deal.profiles?.full_name || deal.business_name || 'Business' })));
      setCompletedDeals((completedResult.data || []) as Deal[]);
      setAgents((agentsResult.data || []) as Agent[]);
      setLoading(false);
    }
    loadDashboard();
  }, [router]);

  const plan = String(builderProfile?.subscription_plan || 'free').toLowerCase();
  const planName = plan === 'business' ? 'Business 👑' : plan === 'growth' ? 'Growth ⚡' : plan === 'starter' ? 'Starter ✦' : 'Free Plan';
  const feePercent = plan === 'growth' ? 4 : plan === 'business' ? 3 : 5;
  const agentLimit = plan === 'free' ? 0 : plan === 'starter' ? 3 : plan === 'growth' ? 10 : 999;
  const publishedAgents = agents.filter((agent) => agent.status === 'published' || (agent as any).is_published);
  const publishedCount = publishedAgents.length || Number(builderProfile?.published_agents_count || 0);
  const progress = agentLimit >= 999 ? 100 : Math.min((publishedCount / Math.max(agentLimit, 1)) * 100, 100);
  const totalEarned = completedDeals.reduce((sum, deal) => sum + Number(deal.builder_payout ?? deal.amount ?? 0), 0);
  const thisMonth = completedDeals.filter((deal: any) => {
    if (!deal.created_at) return false;
    const d = new Date(deal.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, deal) => sum + Number(deal.builder_payout ?? deal.amount ?? 0), 0);
  const avgRating = builderProfile?.avg_rating ? Number(builderProfile.avg_rating).toFixed(1) : '—';
  const reviews = Number(builderProfile?.total_reviews || 0);

  async function submitDelivery() {
    if (!deliveryDeal || !deliveryUrl.trim()) return;
    setSavingDelivery(true);
    const supabase = createClient();
    await supabase.from('deals').update({ status: 'submitted', delivery_url: deliveryUrl, delivery_notes: deliveryNotes }).eq('id', deliveryDeal.id);
    setDeals((current) => current.map((deal) => deal.id === deliveryDeal.id ? { ...deal, status: 'submitted' } : deal));
    setDeliveryDeal(null);
    setDeliveryUrl('');
    setDeliveryNotes('');
    setSavingDelivery(false);
  }

  return (
    <div className="dash-shell builder-page">
      <button className="hamburger" onClick={() => setMenuOpen(true)} aria-label="Open dashboard menu"><Menu size={20} /></button>
      <Sidebar profile={profile} email={email} plan={plan} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="dash-main">
        <div className="topbar">
          <div>
            <h1>Welcome back, {firstName(profile)} 👋</h1>
            <p>Track earnings, deals, and your published AI products.</p>
          </div>
          <DashboardActions />
        </div>

        <div className="stats-grid">
          {loading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="stat-card"><Skeleton className="h-4 w-24" /><Skeleton className="mt-5 h-8 w-20" /></div>) : (
            <>
              <StatCard label="Total Earned" value={money(totalEarned)} icon={<IndianRupee size={18} />} iconBg="#68D39120" iconColor={C.success} trend={`+${money(thisMonth)} this month`} />
              <StatCard label="Active Deals" value={deals.filter((d) => d.status === 'in_progress').length} icon={<Briefcase size={18} />} iconBg="#ae9bc920" iconColor={C.blue} trend="In progress" />
              <StatCard label="My Rating" value={avgRating} icon={<Star size={18} />} iconBg="#F6AD5520" iconColor={C.warning} trend={`${reviews} reviews total`} />
              <StatCard label="Agents Listed" value={publishedCount} icon={<Package size={18} />} iconBg="#7C5CBF20" iconColor={C.purple} trend={`${publishedCount}/${agentLimit >= 999 ? '∞' : agentLimit} based on plan`} />
            </>
          )}
        </div>

        <section className="subscription-banner">
          <div>
            <div className="eyebrow">Current Plan</div>
            <h2>{planName}</h2>
            <p>Platform fee: {feePercent}%</p>
          </div>
          <div>
            <div className="usage-label">Agents Published</div>
            <div className="progress wide"><i style={{ width: `${progress}%` }} /></div>
            <span>{publishedCount} / {agentLimit >= 999 ? '∞' : agentLimit} agents</span>
          </div>
          <button className={plan === 'free' ? 'purple-btn' : 'purple-outline'} onClick={() => router.push('/pricing')}>
            {plan === 'free' ? 'Subscribe to Publish →' : 'Upgrade Plan →'}
          </button>
        </section>

        <div className="builder-middle">
          <section className="panel table-panel">
            <div className="table-head"><h2>Active Deals</h2></div>
            <table>
              <thead><tr>{['Business', 'Amount', 'Status', 'Action'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {loading ? Array.from({ length: 3 }).map((_, r) => <tr key={r}>{Array.from({ length: 4 }).map((__, c) => <td key={c}><Skeleton className="h-4 w-24" /></td>)}</tr>) : deals.length ? deals.map((deal) => {
                  const meta = statusMeta(deal.status);
                  const name = deal.business_name || deal.profiles?.full_name || 'Business';
                  return (
                    <tr key={deal.id}>
                      <td><div className="person"><span>{initials(name)}</span><strong>{name}</strong></div></td>
                      <td className="amount">{money(Number(deal.amount || 0))}</td>
                      <td><span className="badge" style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>{meta.label}</span></td>
                      <td>{deal.status === 'in_progress' ? <button className="deliver-btn" onClick={() => setDeliveryDeal(deal)}>Mark Delivered</button> : <button className="outline-btn" onClick={() => router.push(`/messages?conversation=${deal.conversation_id || ''}`)}>Open Chat</button>}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={4}><Empty title="No active deals" text="Browse business needs and start your next project" action="Browse Marketplace →" onClick={() => router.push('/marketplace')} /></td></tr>}
              </tbody>
            </table>
          </section>

          <section className="panel trending">
            <h2><Flame size={18} /> Trending This Week</h2>
            <p>Businesses searching right now</p>
            <div className="need-list">
              {needs.map(([label, count]) => <div key={label}><span>{label}</span><b>{count}</b></div>)}
            </div>
            <button className="blue-soft" onClick={() => router.push('/marketplace')}>Browse Business Requirements →</button>
          </section>
        </div>

        <section className="panel table-panel">
          <div className="table-head"><h2>My Agents</h2><button className="mini-purple" onClick={() => router.push('/studio')}>Build with AI →</button></div>
          <table>
            <thead><tr>{['Agent', 'Category', 'Price', 'Status', 'Sales', 'Actions'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {loading ? Array.from({ length: 3 }).map((_, r) => <tr key={r}>{Array.from({ length: 6 }).map((__, c) => <td key={c}><Skeleton className="h-4 w-24" /></td>)}</tr>) : agents.length ? agents.map((agent) => {
                const cat = categoryMeta(agent.category);
                const price = Number(agent.price_monthly ?? agent.price_one_time ?? agent.price ?? 0);
                const live = agent.status === 'published';
                const pending = agent.status === 'pending';
                return (
                  <tr key={agent.id}>
                    <td><div className="agent-name"><span>{String(agent.category || '').includes('website') ? '🌐' : '🤖'}</span><strong>{agent.name || 'Untitled Agent'}</strong></div></td>
                    <td><span className="pill" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span></td>
                    <td className="amount">{money(price)}{agent.pricing_model === 'monthly' ? '/mo' : ''}</td>
                    <td><span className="badge" style={{ background: live ? '#68D39120' : pending ? '#F6AD5520' : '#1E1B3A', color: live ? C.success : pending ? C.warning : C.gray, borderColor: live ? '#68D39140' : pending ? '#F6AD5540' : C.border }}>{live ? 'Live ✓' : pending ? 'Under Review' : 'Draft'}</span></td>
                    <td>{agent.sales ?? agent.orders ?? 0}</td>
                    <td><div className="row-actions"><button>Edit</button><button>View</button></div></td>
                  </tr>
                );
              }) : <tr><td colSpan={6}><Empty title="No agents published yet" text="Build an agent with AI Studio and publish" action="Build with AI Studio →" onClick={() => router.push('/studio')} /></td></tr>}
            </tbody>
          </table>
        </section>

        <section className="panel earnings">
          <div className="table-head"><h2>Earnings Overview</h2><select><option>This Month</option><option>Last 3 Months</option><option>This Year</option></select></div>
          <div className="chart">
            {earnings.map(([month, height, label]) => <div key={month} className="bar-wrap"><div className="bar" style={{ height: `${height}%` }}><span>{label}</span></div></div>)}
          </div>
          <div className="chart-labels">{earnings.map(([month]) => <span key={month}>{month}</span>)}</div>
          <div className="summary-row">
            <div><span>Total Earned</span><strong>{money(totalEarned)}</strong></div>
            <div><span>This Month</span><strong>{money(thisMonth)}</strong></div>
            <div><span>Pending</span><strong>{money(deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0))}</strong></div>
          </div>
        </section>
      </main>

      {deliveryDeal && (
        <div className="modal-backdrop" onClick={() => setDeliveryDeal(null)}>
          <div className="delivery-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Submit Delivery</h2>
            <label>Live URL</label>
            <input value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} placeholder="https://..." />
            <label>Delivery Notes</label>
            <textarea value={deliveryNotes} onChange={(e) => setDeliveryNotes(e.target.value)} placeholder="Describe what was delivered..." />
            <div className="modal-actions"><button onClick={() => setDeliveryDeal(null)}>Cancel</button><button onClick={submitDelivery} disabled={savingDelivery || !deliveryUrl.trim()}>{savingDelivery ? 'Submitting...' : 'Submit Delivery'}</button></div>
          </div>
        </div>
      )}
      <BuilderStyles />
    </div>
  );
}

function Empty({ title, text, action, onClick }: { title: string; text: string; action?: string; onClick?: () => void }) {
  return <div className="empty-state"><div className="empty-symbol">📦</div><h3>{title}</h3><p>{text}</p>{action && <button className="primary-btn" onClick={onClick}>{action}</button>}</div>;
}

function BuilderStyles() {
  return (
    <style jsx global>{`
      .dash-shell{display:flex;height:100vh;overflow:hidden;background:${C.page};color:white}.dash-sidebar{width:240px;flex-shrink:0;background:${C.sidebar};border-right:1px solid ${C.border};height:100vh;display:flex;flex-direction:column;overflow-y:auto}.side-top{padding:20px 16px;border-bottom:1px solid ${C.border}}.logo-row,.user-row{display:flex;align-items:center;gap:10px}.logo-text{font-size:22px;font-weight:900;letter-spacing:-.04em}.logo-text strong{color:${C.blue}}.user-row{margin-top:16px}.avatar,.person span{width:36px;height:36px;background:linear-gradient(135deg,${C.blue},${C.purple});border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800}.person span{width:30px;height:30px;font-size:12px}.user-name{font-size:14px;font-weight:600}.role-pill{display:inline-flex;margin-top:4px;background:#7C5CBF20;color:${C.purple};border:1px solid #7C5CBF40;border-radius:100px;padding:2px 8px;font-size:10px;font-weight:700}.side-nav{flex:1;padding:8px 0}.section-label{padding:16px 16px 6px;color:${C.gray};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}.nav-item{display:flex;align-items:center;gap:10px;padding:10px 16px;color:${C.gray};font-size:14px;font-weight:500;position:relative;transition:all .15s;text-decoration:none}.nav-item:hover{background:${C.border};color:white}.builder .nav-item.active{background:rgba(124,92,191,.14);color:${C.purple};font-weight:600}.builder .nav-item.active:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:${C.purple};border-radius:0 2px 2px 0}.side-bottom{border-top:1px solid ${C.border};padding:16px}.email-line{color:${C.gray};font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.upgrade-soft{margin-top:8px;width:100%;background:#7C5CBF15;border:1px solid #7C5CBF40;color:${C.purple};border-radius:8px;padding:8px;font-size:12px;font-weight:600}.dash-main{flex:1;overflow-y:auto;padding:32px;background:${C.page}}.topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;gap:16px}.topbar h1{font-size:26px;font-weight:800;margin:0}.topbar p{color:${C.gray};font-size:14px;margin:4px 0 0}.top-actions{display:flex;gap:10px}.primary-btn,.purple-btn,.purple-outline,.mini-purple,.blue-soft{border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0}.primary-btn{background:${C.blue};color:#08080F;padding:10px 16px}.primary-btn:hover{background:${C.blueHover};color:white}.purple-btn,.mini-purple{background:${C.purple};color:white;padding:10px 16px}.purple-btn:hover,.mini-purple:hover{background:${C.purpleHover}}.purple-outline{background:#7C5CBF15;border:1px solid ${C.purple};color:${C.purple};padding:10px 16px}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}.stat-card,.panel,.subscription-banner{background:${C.card};border:1px solid ${C.border};border-radius:16px}.stat-card{padding:20px 22px}.stat-top{display:flex;justify-content:space-between}.stat-label{color:${C.gray};font-size:13px}.stat-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center}.stat-value{font-size:30px;font-weight:800;margin-top:12px;margin-bottom:6px}.stat-trend{font-size:12px;color:${C.gray}}.subscription-banner{border-color:#7C5CBF40;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:24px}.eyebrow,.usage-label{color:${C.gray};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.subscription-banner h2{font-size:22px;margin:6px 0 0}.subscription-banner p{color:${C.gray};font-size:13px;margin:4px 0 0}.progress{height:8px;background:${C.border};border-radius:100px;overflow:hidden;margin-top:6px}.progress.wide{width:200px}.progress i{display:block;height:100%;background:${C.purple};border-radius:100px}.subscription-banner span{display:block;color:white;font-size:12px;margin-top:4px}.builder-middle{display:grid;grid-template-columns:1fr 380px;gap:20px;margin-bottom:24px}.panel{padding:22px;margin-bottom:24px}.table-panel{padding:0;overflow:hidden}.table-head{padding:18px 22px;border-bottom:1px solid ${C.border};display:flex;justify-content:space-between;align-items:center}.table-head h2,.trending h2{font-size:16px;margin:0;font-weight:700}.trending h2{display:flex;gap:8px;align-items:center}.trending p{color:${C.gray};font-size:12px;margin:4px 0 16px}.need-list div{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(30,27,58,.75)}.need-list span{font-size:14px}.need-list b{background:rgba(174,155,201,.1);color:${C.blue};border:1px solid rgba(174,155,201,.28);border-radius:100px;padding:2px 10px;font-size:11px}.blue-soft{margin-top:14px;background:rgba(174,155,201,.1);border:1px solid rgba(174,155,201,.32);color:${C.blue};padding:10px 14px}.blue-soft:hover{background:rgba(174,155,201,.16)}.mini-purple{border-radius:8px;padding:7px 14px;font-size:12px}table{width:100%;border-collapse:collapse}thead{background:${C.page}}th{padding:10px 22px;color:${C.gray};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;text-align:left;border-bottom:1px solid ${C.border}}td{padding:14px 22px;border-bottom:1px solid rgba(30,27,58,.75)}tr:hover td{background:rgba(174,155,201,.08)}.person,.agent-name{display:flex;align-items:center;gap:10px}.person strong,.agent-name strong{font-size:14px}.amount{color:${C.blue};font-weight:700}.badge,.pill{display:inline-flex;border:1px solid;border-radius:100px;padding:3px 10px;font-size:11px;font-weight:600;white-space:nowrap}.pill{border:0}.deliver-btn,.outline-btn{border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer}.deliver-btn{background:#F6AD5520;border:1px solid ${C.warning};color:${C.warning};font-weight:600}.outline-btn{background:transparent;border:1px solid ${C.border};color:${C.gray}}.outline-btn:hover{border-color:${C.blue};color:${C.blue}}.row-actions{display:flex;gap:8px}.row-actions button{background:transparent;border:1px solid ${C.border};color:${C.gray};border-radius:8px;padding:6px 12px;font-size:12px}.row-actions button:hover{border-color:${C.blue};color:${C.blue}}.empty-state{text-align:center;padding:40px 22px}.empty-symbol{font-size:40px;margin-bottom:12px}.empty-state h3{font-size:16px;margin:0;color:white}.empty-state p{font-size:13px;color:${C.gray};margin:6px 0 16px}.earnings select{background:${C.page};border:1px solid ${C.border};color:${C.gray};border-radius:8px;padding:5px 10px;font-size:12px}.chart{display:flex;align-items:flex-end;gap:8px;height:120px;margin-top:20px}.bar-wrap{flex:1;height:100%;display:flex;align-items:flex-end}.bar{width:100%;background:rgba(174,155,201,.12);border:1px solid rgba(174,155,201,.28);border-radius:4px 4px 0 0;position:relative;transition:background .2s}.bar:hover{background:rgba(174,155,201,.22)}.bar span{display:none;position:absolute;top:-30px;left:50%;transform:translateX(-50%);background:${C.card};border:1px solid ${C.border};border-radius:6px;padding:3px 8px;font-size:11px;white-space:nowrap}.bar:hover span{display:block}.chart-labels{display:flex;gap:8px;margin-top:8px}.chart-labels span{flex:1;text-align:center;color:${C.gray};font-size:11px}.summary-row{display:flex;gap:24px;border-top:1px solid ${C.border};padding-top:14px;margin-top:16px}.summary-row span{display:block;color:${C.gray};font-size:12px}.summary-row strong{font-size:18px}.modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.68);display:flex;align-items:center;justify-content:center;z-index:80}.delivery-modal{width:400px;max-width:92vw;background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:24px}.delivery-modal h2{font-size:18px;margin:0 0 18px}.delivery-modal label{display:block;color:${C.gray};font-size:13px;margin:12px 0 6px}.delivery-modal input,.delivery-modal textarea{width:100%;background:${C.page};border:1px solid ${C.border};border-radius:8px;padding:10px 14px;color:white;outline:none}.delivery-modal input:focus,.delivery-modal textarea:focus{border-color:${C.blue}}.delivery-modal textarea{height:80px;resize:none}.modal-actions{display:flex;gap:10px;margin-top:20px}.modal-actions button{flex:1;border-radius:8px;padding:10px;font-size:14px}.modal-actions button:first-child{background:transparent;border:1px solid ${C.border};color:${C.gray}}.modal-actions button:last-child{background:${C.blue};border:0;color:#08080F;font-weight:800}.hamburger,.mobile-close{display:none}.skeleton{background:${C.border};border-radius:8px;animation:pulse 1.7s ease-in-out infinite}.h-4{height:16px}.h-8{height:32px}.w-20{width:80px}.w-24{width:96px}.mt-5{margin-top:20px}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}
      @media(max-width:1100px){.stats-grid{grid-template-columns:repeat(2,1fr)}.builder-middle{grid-template-columns:1fr}.subscription-banner{align-items:flex-start;flex-direction:column}}@media(max-width:760px){.hamburger{display:flex;position:fixed;top:16px;left:16px;z-index:60;width:40px;height:40px;align-items:center;justify-content:center;border:1px solid ${C.border};border-radius:10px;background:${C.card};color:white}.mobile-close{display:flex;margin-left:auto;background:transparent;border:0;color:${C.gray}}.dash-sidebar{position:fixed;left:0;top:0;z-index:70;transform:translateX(-100%);transition:transform .2s}.dash-sidebar.open{transform:translateX(0)}.dash-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:65;border:0}.dash-main{padding:72px 16px 24px}.topbar{flex-direction:column}.top-actions{width:100%;flex-wrap:wrap}.stats-grid{grid-template-columns:1fr}.table-panel{overflow-x:auto}table{min-width:760px}.summary-row{flex-direction:column;gap:12px}}
    `}</style>
  );
}
