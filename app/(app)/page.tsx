'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { Plus, Zap, Star, Users, Building2, TrendingUp, ArrowRight, Shield, Bot, Sparkles, Check, MessageSquare, Clock, Globe } from 'lucide-react';
import { MeetvoLogo } from '@/components/ui/HandshakeLogo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { AgentCard, AgentCardSkeleton } from '@/components/marketplace/AgentCard';
import { BuilderCard, BuilderCardSkeleton } from '@/components/marketplace/BuilderCard';
import type { Agent, Profile, BuilderProfile, Requirement } from '@/types';
import { useChatStore } from '@/stores/chatStore';

const CATEGORIES = ['All', 'WhatsApp', 'Customer Support', 'Lead Gen', 'Booking', 'E-commerce'];

export default function MarketplacePage() {
  const { user, profile } = useAuth();

  if (!user) return <LandingPage />;
  if (profile?.current_mode === 'builder') return <BuilderHome />;
  return <BuyerHome />;
}

// ─── Buyer Home ────────────────────────────────────────────────────────────────

function BuyerHome() {
  const [tab, setTab] = useState<'agents' | 'builders'>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [builders, setBuilders] = useState<Array<{ profile: Profile; builderProfile: BuilderProfile }>>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();
      let q = supabase.from('agents').select('*, profiles(full_name, avatar_url), builder_profiles(verification_status, avg_rating, response_time_hours)').eq('status', 'published');
      if (category !== 'All') q = q.ilike('category', `%${category}%`);
      if (search) q = q.ilike('name', `%${search}%`);
      if (sort === 'featured') q = q.eq('is_featured', true).order('created_at', { ascending: false });
      else if (sort === 'newest') q = q.order('created_at', { ascending: false });
      else if (sort === 'rated') q = q.order('avg_rating', { ascending: false });
      else if (sort === 'price_asc') q = q.order('price_monthly', { ascending: true, nullsFirst: false });
      const { data } = await q.limit(12);
      setAgents((data || []) as unknown as Agent[]);

      const { data: bData } = await supabase.from('profiles').select('*, builder_profiles(*)').eq('builder_profiles.verification_status', 'verified').not('builder_profiles', 'is', null).eq('builder_profiles.show_on_hire_page', true).limit(9);
      if (bData) {
        setBuilders(bData.filter((b: Record<string, unknown>) => b.builder_profiles).map((b: Record<string, unknown>) => ({ profile: b as unknown as Profile, builderProfile: (b as Record<string, unknown>).builder_profiles as unknown as BuilderProfile })));
      }
      setLoading(false);
    }
    load();
  }, [category, sort, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1 p-1 bg-surface2 rounded-xl border border-border w-fit">
          {(['agents', 'builders'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-brand text-white shadow-lg shadow-brand/25' : 'text-text2 hover:text-text'}`}>
              {t === 'agents' ? 'AI Agents' : 'Builders'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'agents' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents..."
              className="flex-1 bg-surface2 border border-border focus:border-brand rounded-xl px-4 py-2.5 text-text placeholder-text3 outline-none text-sm transition-all" />
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-surface2 border border-border focus:border-brand rounded-xl px-3 py-2.5 text-text outline-none text-sm transition-all">
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="rated">Highest Rated</option>
              <option value="price_asc">Price: Low to High</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${category === c ? 'bg-brand border-brand text-white shadow-md shadow-brand/20' : 'bg-surface2 border-border text-text2 hover:border-brand/50 hover:text-text'}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? Array.from({ length: 6 }).map((_, i) => <AgentCardSkeleton key={i} />) :
              agents.length > 0 ? agents.map((a) => <AgentCard key={a.id} agent={a as Parameters<typeof AgentCard>[0]['agent']} />) :
              <div className="col-span-3 text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-surface3 flex items-center justify-center mx-auto mb-4">
                  <Bot size={28} className="text-text3" />
                </div>
                <p className="text-text2 font-medium mb-1">No agents found</p>
                <p className="text-text3 text-sm">Try a different search or category</p>
              </div>}
          </div>
        </>
      )}

      {tab === 'builders' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? Array.from({ length: 6 }).map((_, i) => <BuilderCardSkeleton key={i} />) :
            builders.length > 0 ? builders.map(({ profile, builderProfile }) => <BuilderCard key={profile.id} profile={profile} builderProfile={builderProfile} />) :
            <div className="col-span-3 text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-surface3 flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-text3" />
              </div>
              <p className="text-text2 font-medium mb-1">No verified builders listed yet</p>
              <p className="text-text3 text-sm">Check back soon as we onboard our first builders</p>
            </div>}
        </div>
      )}
    </div>
  );
}

// ─── Builder Home ──────────────────────────────────────────────────────────────

function BuilderHome() {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<'agents' | 'businesses' | 'studio'>('agents');
  const [myAgents, setMyAgents] = useState<Agent[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const supabase = createClient();
      const [{ data: a }, { data: r }] = await Promise.all([
        supabase.from('agents').select('*').eq('builder_id', user!.id).neq('status', 'deleted').order('created_at', { ascending: false }),
        supabase.from('requirements').select('*, profiles(full_name), buyer_profiles(business_name, industry)').eq('status', 'open').order('created_at', { ascending: false }).limit(20),
      ]);
      setMyAgents((a || []) as Agent[]);
      setRequirements((r || []) as unknown as Requirement[]);
      setLoading(false);
    }
    load();
  }, [user]);

  async function toggleAgentStatus(id: string, current: string) {
    const supabase = createClient();
    const newStatus = current === 'published' ? 'paused' : 'published';
    await supabase.from('agents').update({ status: newStatus }).eq('id', id);
    setMyAgents((prev) => prev.map((a) => a.id === id ? { ...a, status: newStatus as Agent['status'] } : a));
  }

  async function deleteAgent(id: string) {
    if (!confirm('Delete this agent?')) return;
    const supabase = createClient();
    await supabase.from('agents').update({ status: 'deleted' }).eq('id', id);
    setMyAgents((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-1 p-1 bg-surface2 rounded-xl border border-border w-fit mb-8">
        {(['agents', 'businesses', 'studio'] as const).map((t) => (
          <button key={t} onClick={() => t === 'studio' ? router.push('/studio') : setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-brand text-white shadow-lg shadow-brand/25' : 'text-text2 hover:text-text'}`}>
            {t === 'agents' ? 'My Agents' : t === 'businesses' ? 'Businesses' : 'AI Studio'}
          </button>
        ))}
      </div>

      {tab === 'agents' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-text">My Agents</h2>
            <button onClick={() => router.push('/studio')} className="bg-brand hover:bg-brand2 text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-brand/20">
              <Plus size={16} /> Add New Agent
            </button>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-surface2 rounded-xl animate-pulse" />)}
            </div>
          ) : myAgents.length === 0 ? (
            <div className="text-center py-20 bg-gradient-to-b from-surface2 to-surface rounded-2xl border border-border">
              <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
                <Zap size={28} className="text-brand" />
              </div>
              <p className="text-text font-semibold mb-1">No agents yet</p>
              <p className="text-text3 text-sm mb-6">Use AI Studio to build your first agent</p>
              <button onClick={() => router.push('/studio')} className="bg-brand hover:bg-brand2 text-white rounded-xl px-6 py-2.5 font-semibold transition-all shadow-lg shadow-brand/20">
                Open AI Studio
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myAgents.map((agent) => (
                <div key={agent.id} className="bg-surface2 border border-border hover:border-border2 rounded-xl p-4 flex items-center gap-4 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                    <Bot size={18} className="text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text truncate">{agent.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agent.status === 'published' ? 'bg-green/15 text-green' : agent.status === 'draft' ? 'bg-amber/15 text-amber' : 'bg-text3/15 text-text3'}`}>
                        {(agent.status ?? 'unknown').charAt(0).toUpperCase() + (agent.status ?? 'unknown').slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text3">
                      <span>{agent.views} views</span>
                      <span>{agent.orders} orders</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => router.push(`/agent/${agent.id}`)} className="text-xs px-3 py-1.5 bg-surface3 hover:bg-border border border-border text-text rounded-lg transition-colors">Edit</button>
                    <button onClick={() => toggleAgentStatus(agent.id, agent.status ?? 'draft')} className="text-xs px-3 py-1.5 bg-surface3 hover:bg-border border border-border text-text2 rounded-lg transition-colors">
                      {agent.status === 'published' ? 'Pause' : 'Publish'}
                    </button>
                    <button onClick={() => deleteAgent(agent.id)} className="text-xs px-3 py-1.5 bg-red/10 hover:bg-red/20 border border-red/30 text-red rounded-lg transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'businesses' && (
        <>
          <h2 className="text-xl font-bold text-text mb-6">Open Business Requirements</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-surface2 rounded-xl animate-pulse" />)}
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-16 text-text3">No open requirements at the moment.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {requirements.map((req) => (
                <RequirementCard key={req.id} requirement={req} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RequirementCard({ requirement }: { requirement: Requirement }) {
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useChatStore();

  async function handleMessage() {
    if (!user) { router.push('/login'); return; }
    const supabase = createClient();
    const { data: existing } = await supabase.from('conversations').select('id').eq('buyer_id', requirement.buyer_id).eq('builder_id', user.id).is('agent_id', null).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data } = await supabase.from('conversations').insert({ buyer_id: requirement.buyer_id, builder_id: user.id, requirement_id: requirement.id }).select('id').single();
      convId = data?.id;
    }
    if (convId) {
      openChat({
        id: convId,
        participantId: requirement.buyer_id,
        participantName: `Business in ${(requirement as unknown as Record<string, Record<string, string>>).buyer_profiles?.industry || requirement.category}`,
        participantAvatar: null,
        isVerified: false,
        responseTimeHours: 24,
        isMinimised: false,
      });
    }
  }

  const bp = (requirement as unknown as Record<string, Record<string, string>>).buyer_profiles;

  return (
    <div className="bg-surface2 border border-border hover:border-border2 rounded-xl p-5 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs bg-blue/15 text-blue px-2 py-0.5 rounded-full font-medium">{bp?.industry || requirement.category}</span>
        <span className="text-text3 text-xs">{new Date(requirement.created_at ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
      </div>
      <h3 className="font-semibold text-text mb-2 line-clamp-2">{requirement.title}</h3>
      <p className="text-text3 text-sm line-clamp-2 mb-4">{requirement.description}</p>
      <div className="flex items-center justify-between mb-4">
        {requirement.budget_min && requirement.budget_max && (
          <span className="text-green text-sm font-semibold">₹{requirement.budget_min.toLocaleString('en-IN')}–₹{requirement.budget_max.toLocaleString('en-IN')}</span>
        )}
        {requirement.timeline && <span className="text-text3 text-xs">{requirement.timeline}</span>}
      </div>
      <button onClick={handleMessage} className="w-full bg-brand hover:bg-brand2 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all">
        Message Business
      </button>
    </div>
  );
}

// ─── Landing Page ──────────────────────────────────────────────────────────────

interface PlatformStats {
  builders: number;
  agents: number;
  buyers: number;
}

function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ count: builders }, { count: agents }, { count: buyers }] = await Promise.all([
        supabase.from('builder_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('agents').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('buyer_profiles').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ builders: builders || 0, agents: agents || 0, buyers: buyers || 0 });
    }
    load();
  }, []);

  return stats;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' } }),
};

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'show' : 'hidden'} variants={staggerContainer} className={className}>
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Shield,
    color: 'text-green',
    bg: 'bg-green/10 border-green/20',
    title: 'Escrow Protection',
    desc: 'Funds are held securely until you approve the delivered work. Zero risk payments.',
  },
  {
    icon: Bot,
    color: 'text-blue',
    bg: 'bg-blue/10 border-blue/20',
    title: 'AI Builder Studio',
    desc: 'Describe your automation in plain English. Claude AI generates the full agent spec.',
  },
  {
    icon: Users,
    color: 'text-amber',
    bg: 'bg-amber/10 border-amber/20',
    title: 'Verified Builders',
    desc: 'Every builder is manually reviewed. Only proven AI professionals make the cut.',
  },
  {
    icon: Globe,
    color: 'text-brand',
    bg: 'bg-brand/10 border-brand/20',
    title: 'India-First',
    desc: 'Built for Indian SMBs. Agents speak Hindi & English. Payments in INR via Razorpay.',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Browse & Discover', desc: 'Explore hundreds of ready-to-deploy AI agents or post your custom requirement.' },
  { step: '02', title: 'Connect & Agree', desc: 'Chat directly with verified builders. Get a quote, timeline, and scope — all in one place.' },
  { step: '03', title: 'Pay with Escrow', desc: 'Funds are held until you review and approve the work. Complete payment protection.' },
  { step: '04', title: 'Deploy & Scale', desc: 'Get your AI agent running live. Track orders and scale with more automations anytime.' },
];

function LandingPage() {
  const stats = usePlatformStats();

  const hasStats = stats && (stats.builders > 0 || stats.agents > 0 || stats.buyers > 0);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-0 overflow-hidden">
        {/* Subtle background dots */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #5B21FF 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

        {/* Soft glow behind hero text */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-brand/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 text-center z-10 w-full">
          {/* Pill badge */}
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="show" className="mb-8">
            <div className="inline-flex items-center gap-2 bg-surface2 border border-border hover:border-border2 rounded-full px-5 py-2 text-sm font-medium transition-colors cursor-default">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
              <span className="text-text2">India&apos;s First AI Automation Marketplace</span>
              <span className="text-brand font-semibold">MeetvoAI</span>
            </div>
          </motion.div>

          {/* Headline — Devin-style: massive, centered, no frills */}
          <motion.h1 variants={fadeUp} custom={1} initial="hidden" animate="show"
            className="text-6xl md:text-[88px] font-extrabold text-text leading-[1.02] tracking-[-0.03em] mb-6">
            Connect. Build.<br />
            <span className="bg-gradient-to-r from-brand via-blue to-green bg-clip-text text-transparent">
              Automate.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} initial="hidden" animate="show"
            className="text-text2 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Hire verified AI builders or browse ready-made agents. Payments secured by escrow. Built for India.
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={fadeUp} custom={3} initial="hidden" animate="show"
            className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
            <Link href="/signup"
              className="group inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand2 text-white rounded-xl px-7 py-3.5 font-semibold text-base transition-all shadow-xl shadow-brand/25 hover:shadow-brand/40">
              Get Started Free
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-surface2 border border-border hover:border-border2 text-text rounded-xl px-7 py-3.5 font-semibold text-base transition-all">
              Sell Your AI Skills
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div variants={fadeUp} custom={4} initial="hidden" animate="show"
            className="flex flex-wrap items-center justify-center gap-6 mb-14 text-sm text-text3">
            {[
              { icon: Shield, label: 'Escrow Protected', color: 'text-green' },
              { icon: Check, label: 'Verified Builders', color: 'text-blue' },
              { icon: MessageSquare, label: 'Chat & Negotiate', color: 'text-amber' },
              { icon: Clock, label: 'Fast Delivery', color: 'text-brand' },
            ].map(({ icon: Icon, label, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon size={14} className={color} />
                {label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Product UI Mockup — Devin style: browser chrome + dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          className="relative w-full max-w-6xl mx-auto px-4 z-10"
        >
          {/* Browser chrome */}
          <div className="relative rounded-t-2xl bg-surface2 border border-border border-b-0 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red/70" />
              <div className="w-3 h-3 rounded-full bg-amber/70" />
              <div className="w-3 h-3 rounded-full bg-green/70" />
            </div>
            <div className="flex-1 bg-surface3 border border-border rounded-lg px-3 py-1 text-xs text-text3 text-center max-w-sm mx-auto">
              MeetvoAI.com — AI Automation Marketplace
            </div>
          </div>

          {/* Dashboard content */}
          <div className="bg-surface border border-border rounded-b-2xl overflow-hidden"
            style={{ boxShadow: '0 40px 120px -20px rgba(91, 33, 255, 0.12), 0 20px 60px -10px rgba(0,0,0,0.12)' }}>
            <div className="flex h-[460px] md:h-[560px]">
              {/* Left sidebar */}
              <div className="hidden md:flex flex-col w-52 bg-surface2 border-r border-border p-4 shrink-0">
                <div className="flex items-center gap-2 mb-6 px-1">
                  <MeetvoLogo size="sm" />
                </div>
                {[
                  { icon: Bot, label: 'Marketplace', active: true },
                  { icon: MessageSquare, label: 'Messages', active: false },
                  { icon: Shield, label: 'My Orders', active: false },
                  { icon: Sparkles, label: 'AI Studio', active: false },
                  { icon: Star, label: 'Settings', active: false },
                ].map(({ icon: Icon, label, active }) => (
                  <div key={label} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-colors ${active ? 'bg-brand/15 text-brand' : 'text-text3 hover:text-text hover:bg-surface3'}`}>
                    <Icon size={16} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Main panel */}
              <div className="flex-1 overflow-hidden bg-background p-5">
                {/* Tabs */}
                <div className="flex items-center gap-1 mb-5">
                  <div className="flex gap-1 p-1 bg-surface2 rounded-lg border border-border">
                    <div className="px-4 py-1.5 bg-brand rounded-md text-white text-xs font-semibold">AI Agents</div>
                    <div className="px-4 py-1.5 text-text3 text-xs font-medium">Builders</div>
                  </div>
                  <div className="ml-auto flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-1.5">
                    <div className="w-3 h-3 rounded-full bg-surface3" />
                    <span className="text-text3 text-xs">Search agents...</span>
                  </div>
                </div>

                {/* Agent cards grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { name: 'WhatsApp Lead Bot', cat: 'Lead Gen', price: '₹1,999/mo', rating: '4.9', color: 'bg-green/10 text-green border-green/20' },
                    { name: 'Support Agent Pro', cat: 'Customer Support', price: '₹2,499/mo', rating: '4.8', color: 'bg-blue/10 text-blue border-blue/20' },
                    { name: 'Booking Assistant', cat: 'Appointment', price: '₹1,499/mo', rating: '5.0', color: 'bg-amber/10 text-amber border-amber/20' },
                    { name: 'E-commerce Bot', cat: 'E-commerce', price: '₹3,299/mo', rating: '4.7', color: 'bg-brand/10 text-brand border-brand/20' },
                    { name: 'HR Screener AI', cat: 'Recruitment', price: '₹4,999/mo', rating: '4.9', color: 'bg-green/10 text-green border-green/20' },
                    { name: 'Invoice Tracker', cat: 'Finance', price: '₹999/mo', rating: '4.6', color: 'bg-blue/10 text-blue border-blue/20' },
                  ].map((agent) => (
                    <div key={agent.name} className="bg-surface2 border border-border rounded-xl p-3 hover:border-border2 transition-colors">
                      <div className={`text-xs px-2 py-0.5 rounded-full border font-medium w-fit mb-2 ${agent.color}`}>{agent.cat}</div>
                      <p className="text-text text-xs font-semibold mb-1 leading-tight">{agent.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-green text-xs font-bold">{agent.price}</span>
                        <span className="text-text3 text-xs flex items-center gap-0.5">
                          <Star size={9} className="text-amber fill-amber" /> {agent.rating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right chat panel */}
              <div className="hidden lg:flex flex-col w-64 bg-surface2 border-l border-border shrink-0">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-text">Chat with Builder</p>
                  <p className="text-xs text-text3">Arjun K. — Verified</p>
                </div>
                <div className="flex-1 p-3 space-y-3 overflow-hidden">
                  <div className="flex justify-end">
                    <div className="bg-brand rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white max-w-[80%]">
                      Hi! I need a WhatsApp lead bot for my real estate business.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-surface3 border border-border rounded-xl rounded-tl-sm px-3 py-2 text-xs text-text2 max-w-[80%]">
                      Sure! I can build a fully automated lead qualification bot. My quote would be ₹8,500 one-time.
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-brand rounded-xl rounded-tr-sm px-3 py-2 text-xs text-white max-w-[80%]">
                      Sounds good. Can we use escrow?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-surface3 border border-border rounded-xl rounded-tl-sm px-3 py-2 text-xs text-text2 max-w-[80%]">
                      Yes! MeetvoAI handles escrow automatically. You pay, funds held, I deliver, you approve.
                    </div>
                  </div>
                  {/* Offer card preview */}
                  <div className="bg-green/10 border border-green/25 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Shield size={10} className="text-green" />
                      <span className="text-xs font-semibold text-green">Offer Sent</span>
                    </div>
                    <p className="text-xs text-text2">WhatsApp Lead Bot</p>
                    <p className="text-xs font-bold text-text mt-0.5">₹8,500 + platform fee</p>
                  </div>
                </div>
                <div className="p-3 border-t border-border">
                  <div className="bg-surface3 border border-border rounded-lg px-3 py-2 text-xs text-text3">
                    Type a message...
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </motion.div>
      </section>

      {/* ── Real Stats (only shown when data exists) ── */}
      {hasStats && (
        <AnimatedSection>
          <section className="border-y border-border bg-surface py-12">
            <div className="max-w-5xl mx-auto px-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 text-center">
                {[
                  stats.builders > 0 && { value: `${stats.builders}+`, label: 'Verified Builders', color: 'text-brand' },
                  stats.agents > 0 && { value: `${stats.agents}+`, label: 'AI Agents', color: 'text-blue' },
                  stats.buyers > 0 && { value: `${stats.buyers}+`, label: 'Businesses', color: 'text-green' },
                ].filter(Boolean).map((s) => {
                  const stat = s as { value: string; label: string; color: string };
                  return (
                    <motion.div key={stat.label} variants={fadeUp} custom={0}>
                      <p className={`text-4xl font-extrabold ${stat.color} mb-1`}>{stat.value}</p>
                      <p className="text-text3 text-sm">{stat.label}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        </AnimatedSection>
      )}

      {/* ── Features ── */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-4 py-24">
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
            <p className="text-brand text-sm font-semibold uppercase tracking-wider mb-3">Why MeetvoAI</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-text mb-4">Everything you need to automate</h2>
            <p className="text-text2 max-w-xl mx-auto">From discovery to deployment — one platform built for Indian businesses.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }, i) => (
              <motion.div key={title} variants={fadeUp} custom={i + 1}
                className="group relative bg-surface2 border border-border hover:border-border2 rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${bg}`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-semibold text-text mb-2">{title}</h3>
                <p className="text-text3 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </AnimatedSection>

      {/* ── How it works ── */}
      <AnimatedSection>
        <section className="bg-surface border-y border-border py-24">
          <div className="max-w-6xl mx-auto px-4">
            <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
              <p className="text-blue text-sm font-semibold uppercase tracking-wider mb-3">Simple Process</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-text mb-4">Go live in 4 steps</h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
                <motion.div key={step} variants={fadeUp} custom={i + 1} className="relative">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-[calc(100%-12px)] w-6 h-0.5 bg-gradient-to-r from-border2 to-transparent z-10" />
                  )}
                  <div className="bg-surface2 border border-border rounded-2xl p-6 h-full">
                    <div className="text-4xl font-extrabold text-border2 mb-4 leading-none">{step}</div>
                    <h3 className="font-semibold text-text mb-2">{title}</h3>
                    <p className="text-text3 text-sm leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Split section with image ── */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} custom={0}>
              <p className="text-green text-sm font-semibold uppercase tracking-wider mb-3">AI Builder Studio</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-text mb-6 leading-tight">Build AI agents with plain English</h2>
              <p className="text-text2 mb-8 leading-relaxed">
                Describe what you want your agent to do — in Hindi or English. Claude AI generates the complete automation blueprint. No code needed.
              </p>
              <ul className="space-y-4 mb-8">
                {['WhatsApp automation for customer support', 'Lead qualification & CRM integration', 'Appointment booking for clinics & salons', 'E-commerce order tracking bots'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-text2 text-sm">
                    <div className="w-5 h-5 rounded-full bg-green/15 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-green" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="inline-flex items-center gap-2 bg-brand hover:bg-brand2 text-white rounded-xl px-6 py-3 font-semibold transition-all shadow-lg shadow-brand/20 text-sm">
                Try AI Studio Free <ArrowRight size={16} />
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-blue/20 rounded-3xl blur-3xl opacity-50" />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/50">
                <img
                  src="https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
                  alt="AI Studio interface"
                  className="w-full h-[380px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="bg-surface2/90 backdrop-blur border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green animate-pulse" />
                      <span className="text-xs text-text3">AI Studio generating...</span>
                    </div>
                    <p className="text-sm text-text font-medium">&ldquo;Create a WhatsApp bot that qualifies leads for my real estate business&rdquo;</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── Builders section ── */}
      <AnimatedSection>
        <section className="bg-surface border-y border-border py-24">
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUp} custom={0} className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green/20 to-blue/20 rounded-3xl blur-3xl opacity-40" />
              <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl shadow-black/50">
                <img
                  src="https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2"
                  alt="Builder working on AI agents"
                  className="w-full h-[380px] object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="order-1 lg:order-2">
              <p className="text-amber text-sm font-semibold uppercase tracking-wider mb-3">For AI Builders</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-text mb-6 leading-tight">Turn your AI skills into steady income</h2>
              <p className="text-text2 mb-8 leading-relaxed">
                List your AI agents, receive project requests from Indian businesses, and get paid securely through escrow.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { title: 'Zero upfront cost', icon: Star },
                  { title: 'Escrow payments', icon: Shield },
                  { title: 'Your own storefront', icon: TrendingUp },
                  { title: 'Direct client chat', icon: MessageSquare },
                ].map(({ title, icon: Icon }) => (
                  <div key={title} className="flex items-center gap-3 bg-surface2 border border-border rounded-xl px-4 py-3">
                    <Icon size={16} className="text-amber shrink-0" />
                    <span className="text-sm text-text2">{title}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="inline-flex items-center gap-2 bg-amber hover:bg-amber/90 text-background rounded-xl px-6 py-3 font-semibold transition-all shadow-lg shadow-amber/20 text-sm">
                Start Selling <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      {/* ── CTA ── */}
      <AnimatedSection>
        <section className="max-w-6xl mx-auto px-4 py-24">
          <motion.div variants={fadeUp} custom={0}
            className="relative rounded-3xl overflow-hidden border border-brand/20 bg-gradient-to-br from-brand/8 via-surface to-blue/8 p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width%3D%2260%22 height%3D%2260%22 viewBox%3D%220 0 60 60%22 xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg fill%3D%22none%22 fill-rule%3D%22evenodd%22%3E%3Cg fill%3D%22%236C3AFF%22 fill-opacity%3D%220.05%22%3E%3Cpath d%3D%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-80" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-brand/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-brand/15 border border-brand/25 rounded-full px-4 py-1.5 text-brand text-sm font-medium mb-6">
                <Sparkles size={13} className="text-brand" /> Get started free today
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-text mb-6 leading-tight">
                Ready to automate<br />your business?
              </h2>
              <p className="text-text2 text-lg mb-10 max-w-lg mx-auto">
                Join the marketplace. Discover AI agents or become a verified builder. No setup fees.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup"
                  className="group inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand2 text-white rounded-2xl px-8 py-4 font-semibold text-base transition-all shadow-xl shadow-brand/30">
                  Create Free Account <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-surface2 hover:bg-surface3 border border-border text-text rounded-2xl px-8 py-4 font-semibold text-base transition-all">
                  Log In
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      </AnimatedSection>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <MeetvoLogo size="sm" />
          <p className="text-text3 text-sm">Made in India with love for Indian businesses</p>
          <div className="flex gap-6 text-text3 text-sm">
            <Link href="/login" className="hover:text-text transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-text transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
