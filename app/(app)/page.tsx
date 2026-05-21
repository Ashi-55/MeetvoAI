'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Search, Users, ChevronDown, Zap, Lock, Send, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AgentCard, AgentCardSkeleton } from '@/components/marketplace/AgentCard';
import { BuilderCard, BuilderCardSkeleton } from '@/components/marketplace/BuilderCard';
import type { Agent, BuilderProfile, Profile } from '@/types';

const AI_CATEGORIES = ['All', 'WhatsApp', 'Customer Support', 'Lead Gen', 'Booking', 'E-commerce'];

function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<'studio' | 'marketplace' | 'escrow'>('studio');

  const tabs = [
    { id: 'studio' as const, label: 'AI Studio' },
    { id: 'marketplace' as const, label: 'Marketplace' },
    { id: 'escrow' as const, label: 'Escrow Protection' },
  ];

  const content = {
    studio: {
      heading: 'Describe in any language',
      description: 'AI builds the complete workflow instantly. No coding required.',
      icon: '✨',
    },
    marketplace: {
      heading: 'Browse trusted builders',
      description: 'Browse trusted builders with real portfolios. Message directly. No middlemen.',
      icon: '👥',
    },
    escrow: {
      heading: 'Secure payments',
      description: 'Payment is held securely in escrow. Released only after you approve the delivered work. Zero risk.',
      icon: '🔒',
    },
  };

  return (
    <div>
      <div className="mb-8 flex gap-3 justify-center flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-teal text-background'
                : 'bg-transparent border border-surface3 text-text2 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid lg:grid-cols-2 gap-8 items-center"
      >
        <div>
          <h3 className="text-3xl font-bold text-white mb-4">{content[activeTab].heading}</h3>
          <p className="text-lg text-text2">{content[activeTab].description}</p>
        </div>
        <div className="rounded-[16px] border border-surface3 bg-surface p-8 flex items-center justify-center min-h-64">
          <div className="text-5xl">{content[activeTab].icon}</div>
        </div>
      </motion.div>
    </div>
  );
}

function FAQAccordion({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-[12px] border border-surface3 bg-surface overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface2 transition"
      >
        <span className="text-left font-semibold text-white text-lg">{question}</span>
        <ChevronDown
          size={20}
          className={`text-teal transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-6 py-4 text-text2 border-t border-surface3">
          {answer}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HomePage() {
  return <LandingPage />;
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-page text-white">
      <section id="home" className="relative overflow-hidden px-4 pt-24 pb-20 lg:px-8 lg:pt-32">
        <div className="absolute inset-0 grid grid-cols-1 gap-0 bg-page grid-lines opacity-20" />
        <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,_rgba(174, 155, 201, 0.07),_transparent_45%)] pointer-events-none" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center text-center">
          <span className="mb-6 inline-flex items-center rounded-full border border-[#ae9bc940] bg-[#08080F] px-5 py-2 text-sm font-medium text-[#ae9bc9]">
            Built for India · AI automation
          </span>
          <h1 className="text-5xl font-extrabold leading-tight tracking-[-0.05em] text-white sm:text-6xl lg:text-[5.5rem]">
            Build AI Agents.<br />
            <span className="text-gradient-teal-blue">Or Connect With One Who Can.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9490B5] sm:text-xl">
            India&apos;s AI Automation Platform for SMBs, builders, and AI-first workflows.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup?role=business" className="inline-flex items-center justify-center rounded-full bg-[#ae9bc9] px-8 py-4 text-base font-semibold text-[#08080F] transition hover:bg-[#6F4EEA]">
              I Need AI for My Business
            </Link>
            <Link href="/signup?role=builder" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-8 py-4 text-base font-semibold text-white transition hover:bg-[#1E1B3A]">
              I Build AI Agents
            </Link>
          </div>

          <div className="mt-12 mb-2 flex w-full max-w-3xl flex-wrap justify-center gap-3">
            {['Escrow Protected', 'Trusted Builders', 'Made in India'].map((badge) => (
              <div key={badge} className="rounded-2xl border border-[#1E1B3A] bg-[#100F1C] px-4 py-3 text-sm text-[#9490B5]">
                {badge}
              </div>
            ))}
          </div>

          <div className="relative left-1/2 mt-0 w-screen -translate-x-1/2 overflow-hidden py-5">
            <div className="marquee inline-flex min-w-max items-center whitespace-nowrap text-sm text-[#9490B5]">
              <span className="mr-12">WhatsApp Bot • Lead Generation • Appointment Booking • E-commerce Agent • Restaurant Automation • Clinic Management • Real Estate Bot • Support Agent •</span>
              <span className="mr-12">WhatsApp Bot • Lead Generation • Appointment Booking • E-commerce Agent • Restaurant Automation • Clinic Management • Real Estate Bot • Support Agent •</span>
              <span className="mr-12">WhatsApp Bot • Lead Generation • Appointment Booking • E-commerce Agent • Restaurant Automation • Clinic Management • Real Estate Bot • Support Agent •</span>
              <span className="mr-12">WhatsApp Bot • Lead Generation • Appointment Booking • E-commerce Agent • Restaurant Automation • Clinic Management • Real Estate Bot • Support Agent •</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl px-4 lg:px-8">
        <div className="w-full rounded-[16px] border border-[#1E1B3A] bg-[#100F1C] p-10">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
            { value: '63M+', label: 'SMBs in India' },
            { value: '$197B', label: 'Market Opportunity' },
            { value: '24/7', label: 'Agent Uptime' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-4xl font-bold text-[#ae9bc9]">{item.value}</p>
              <p className="mt-2 text-sm text-[#9490B5]">{item.label}</p>
            </div>
          ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto mb-20 max-w-7xl px-4 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[#1E1B3A] bg-surface p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">How It Works</p>
            <h2 className="mt-4 text-4xl font-bold text-white">Find a Builder</h2>
            <div className="mt-8 space-y-4">
              {[
                { title: 'Browse trusted builders', detail: 'Explore curated profiles, ratings, and completed AI projects.' },
                { title: 'Start a conversation', detail: 'Message builders directly and agree on scope, price, and timeline.' },
                { title: 'Secure payment', detail: 'Use escrow protection so funds are released only after delivery.' },
                { title: 'Approve your automation', detail: 'Review the delivered solution and deploy with confidence.' },
                { title: 'Scale with more agents', detail: 'Expand with chatbots, workflows, and AI studio builds.' },
              ].map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-3xl border border-[#ae9bc940] p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ae9bc940] text-xl font-bold text-[#ae9bc9]">{index + 1}</div>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-sm text-[#9490B5]">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#1E1B3A] bg-surface p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">How It Works</p>
            <h2 className="mt-4 text-4xl font-bold text-white">Build It Yourself</h2>
            <div className="mt-8 space-y-4">
              {[
                { title: 'Describe your vision', detail: 'Tell us what automation you need for your business.' },
                { title: 'Generate a plan', detail: 'AI Studio creates your agent workflow, prompts, and launch steps.' },
                { title: 'Review and customize', detail: 'Refine the agent with AI feedback and your business details.' },
                { title: 'Deploy instantly', detail: 'Launch your automation on WhatsApp, website, or chat channels.' },
                { title: 'Grow with analytics', detail: 'Track performance and iterate with smarter workflows.' },
              ].map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-3xl border border-[#ae9bc940] p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ae9bc940] text-xl font-bold text-[#ae9bc9]">{index + 1}</div>
                  <div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="mt-1 text-sm text-[#9490B5]">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl px-4 lg:px-8 py-20">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">The Problem</p>
          <h2 className="mt-4 text-4xl lg:text-5xl font-bold text-white">What's slowing Indian businesses down?</h2>
          <p className="mt-4 text-lg text-[#9490B5] max-w-2xl mx-auto">Let's uncover what's really blocking your growth.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              icon: '💸',
              title: 'Tech costs are unpredictable',
              description: 'Agencies charge lakhs with no guarantee of quality or timeline.',
            },
            {
              icon: '⏳',
              title: 'Finding the right builder takes months',
              description: 'You interview 10 people and still aren\'t sure who to trust.',
            },
            {
              icon: '🤖',
              title: 'AI tools are too complex',
              description: 'ChatGPT, Make.com, Zapier — where do you even start?',
            },
            {
              icon: '😤',
              title: 'No payment protection',
              description: 'You pay upfront and hope the work gets delivered.',
            },
          ].map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group rounded-[16px] border border-surface3 bg-surface p-7 hover:border-teal transition-all duration-300"
            >
              <div className="text-4xl mb-4">{problem.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
              <p className="text-[#9490B5]">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto mb-20 max-w-7xl px-4 lg:px-8 py-20">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">The Solution</p>
          <h2 className="mt-4 text-4xl lg:text-5xl font-bold text-white">How MeetvoAI solves this</h2>
          <p className="mt-4 text-lg text-[#9490B5] max-w-2xl mx-auto">Smart, focused, and built for India.</p>
        </div>
        <FeaturesSection />
      </section>

      <section className="mx-auto mb-20 max-w-7xl px-4 lg:px-8 py-20">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">Capabilities</p>
          <h2 className="mt-4 text-4xl lg:text-5xl font-bold text-white">Everything you need to automate</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: <Zap className="w-6 h-6 text-teal" />, title: 'Instant AI Workflows', description: 'Generate agent logic in seconds' },
            { icon: <Users className="w-6 h-6 text-teal" />, title: 'Trusted Builder Network', description: 'Vetted professionals ready to deploy' },
            { icon: <Lock className="w-6 h-6 text-teal" />, title: 'Escrow Protection', description: 'Pay only when satisfied' },
            { icon: <Send className="w-6 h-6 text-teal" />, title: 'Multi-channel Deploy', description: 'WhatsApp, website, Telegram' },
            { icon: <Globe className="w-6 h-6 text-teal" />, title: 'Made for India', description: 'Built for Indian SMBs and local languages' },
            { icon: <TrendingUp className="w-6 h-6 text-teal" />, title: 'Zero to Launch', description: 'From idea to live agent in days not months' },
          ].map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className="rounded-[12px] border border-surface3 bg-surface p-6"
            >
              <div className="mb-4">{benefit.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
              <p className="text-text2 text-sm">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl px-4 lg:px-8 py-20">
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">Help Center</p>
          <h2 className="mt-4 text-4xl lg:text-5xl font-bold text-white">Frequently Asked Questions</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          <FAQAccordion
            question="Is MeetvoAI free to use?"
            answer="Signing up and browsing the marketplace is completely free. AI Studio requires a subscription."
          />
          <FAQAccordion
            question="How does escrow protection work?"
            answer="When you hire a builder, payment is held securely. It's only released to the builder after you review and approve the delivered work."
          />
          <FAQAccordion
            question="What kind of AI agents can I build?"
            answer="WhatsApp bots, lead generation agents, appointment booking systems, customer support agents, e-commerce automation and much more."
          />
          <FAQAccordion
            question="How long does it take to get an agent built?"
            answer="Using AI Studio you can generate a workflow in seconds. Working with a builder typically takes 3-7 days."
          />
          <FAQAccordion
            question="Is MeetvoAI only for India?"
            answer="We're built for Indian SMBs first but anyone can use the platform."
          />
        </div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl px-4 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="rounded-[20px] border border-teal bg-gradient-to-br from-dark-gradient-start to-dark-gradient-end p-12 md:p-16"
        >
          <div className="flex flex-col items-center text-center gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ready to automate your business?</h2>
              <p className="text-lg text-[#9490B5]">Join India's AI automation platform today.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup?role=business" className="inline-flex items-center justify-center rounded-full bg-teal px-8 py-4 text-base font-semibold text-background transition hover:bg-teal-dark">
                I Need AI for My Business
              </Link>
              <Link href="/signup?role=builder" className="inline-flex items-center justify-center rounded-full border border-surface3 bg-transparent px-8 py-4 text-base font-semibold text-white transition hover:bg-surface3">
                I Build AI Agents
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto mb-20 max-w-7xl px-4 lg:px-8">
        <div className="rounded-3xl border border-[#1E1B3A] bg-[#100F1C] p-6 shadow-teal">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">AI Studio Showcase</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Create agents with a smart terminal UI</h2>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-[#1E1B3A] bg-[#0F172A] p-6">
            <div className="mb-4 flex items-center gap-2 text-sm text-[#9490B5]">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#ae9bc9] animate-pulse" />
              AI Studio terminal — generating your workflow
            </div>
            <div className="space-y-3 font-mono text-sm text-[#9490B5]">
              <p className="text-[#ae9bc9]">$ meetvo generate automation --name restaurant-bot</p>
              <p>Initializing workflow engine...</p>
              <p className="text-white">Connected to WhatsApp, CRM, and payment APIs.</p>
              <p className="text-[#ae9bc9]">Intent capacity: lead capture, order booking, support.</p>
              <p className="text-[#9490B5]">&gt; Response patterns loaded. Deploy with one click.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="marketplace" className="mx-auto mb-20 max-w-7xl px-4 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">What You Can Build</p>
            <h2 className="mt-3 text-4xl font-bold text-white">Launch AI solutions for every industry</h2>
          </div>
          <Link href="/studio" className="inline-flex items-center gap-2 rounded-full bg-[#ae9bc9] px-5 py-3 text-sm font-semibold text-[#08080F] transition hover:bg-[#6F4EEA]">
            Try AI Studio <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            'WhatsApp Lead Bot',
            'Support Assistant',
            'Booking Agent',
            'Sales Outreach',
            'E-commerce Concierge',
            'Appointment Scheduler',
          ].map((title) => (
            <div key={title} className="rounded-3xl border border-[#1E1B3A] bg-[#100F1C] p-6 transition hover:border-[#ae9bc9]">
              <p className="text-sm uppercase tracking-[0.25em] text-[#9490B5]">AI Agent</p>
              <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#9490B5]">Fast to launch, easy to adapt, and fully backed by Indian payments.</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="mx-auto mb-20 max-w-7xl px-4 lg:px-8">
        <div className="rounded-[36px] border border-[#ae9bc9] bg-[#08080F] p-8 shadow-teal">
          <div className="flex flex-col items-center text-center gap-6">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">Ready to launch</p>
              <h2 className="mt-4 text-4xl font-bold text-white">Start building or find AI experts today</h2>
              <p className="mt-4 max-w-xl text-[#9490B5] mx-auto">This is the fastest path from idea to deployed automation for Indian SMBs.</p>
            </div>
            <Link href="/signup?role=business" className="inline-block rounded-[50px] bg-[#ae9bc9] px-12 py-3.5 text-base font-semibold text-[#08080F] transition hover:bg-[#6F4EEA] mt-6 mx-auto">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#1E1B3A] bg-[#100F1C] py-10 px-4 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">AI Automation</p>
            <p className="mt-2 text-sm text-[#9490B5]">AI Automation for Indian businesses, builders, and marketplaces.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-[#9490B5]">
            <Link href="/pricing" className="transition hover:text-white">Pricing</Link>
            <Link href="/studio" className="transition hover:text-white">AI Studio</Link>
            <Link href="/marketplace" className="transition hover:text-white">Marketplace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MarketplacePage() {
  const [tab, setTab] = useState<'agents' | 'builders'>('agents');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [builders, setBuilders] = useState<Array<{ profile: Profile; builderProfile: BuilderProfile }>>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const supabase = createClient();

      const [{ data: agentData }, { data: builderData }] = await Promise.all([
        supabase
          .from('agents')
          .select('*, profiles!agents_builder_id_fkey(full_name, avatar_url), builder_profiles(verification_status, avg_rating, response_time_hours)')
          .eq('is_published', true)
          .order('purchases', { ascending: false })
          .limit(18),
        supabase
          .from('builder_profiles')
          .select('*, profiles!builder_profiles_id_fkey(*)')
          .eq('available', true)
          .order('avg_rating', { ascending: false })
          .limit(18),
      ]);

      setAgents((agentData || []) as Agent[]);
      if (builderData) {
        setBuilders((builderData as any).map((item: any) => ({ profile: item.profiles as Profile, builderProfile: item as BuilderProfile })));
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesCategory = category === 'All' || agent.category?.includes(category);
      const matchesSearch = !search || agent.name?.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [agents, category, search]);

  return (
    <div className="min-h-screen bg-page text-white px-4 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">Marketplace</p>
            <h1 className="mt-3 text-4xl font-bold text-white">Find trusted AI builders or buy ready-made agents.</h1>
          </div>
          <div className="inline-flex rounded-full border border-[#1E1B3A] bg-[#100F1C] p-1">
            {(['AI Agents', 'Builders'] as const).map((label) => {
              const key = label === 'AI Agents' ? 'agents' : 'builders';
              return (
                <button key={label} onClick={() => setTab(key)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${tab === key ? 'bg-[#ae9bc9] text-[#08080F]' : 'text-[#9490B5] hover:text-white'}`}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-[#1E1B3A] bg-[#100F1C] p-6">
          {tab === 'agents' && (
            <>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex flex-wrap gap-2">
                  {AI_CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${category === cat ? 'bg-[#ae9bc9] text-[#08080F]' : 'bg-[#08080F] text-[#9490B5] hover:bg-[#1E1B3A]'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="ml-auto max-w-sm flex-1">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9490B5]" size={18} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search agents..."
                      className="w-full rounded-full border border-[#1E1B3A] bg-[#08080F] px-12 py-3 text-sm text-white outline-none transition focus:border-[#ae9bc9]" />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {loading ? Array.from({ length: 6 }).map((_, index) => <AgentCardSkeleton key={index} />)
                  : filteredAgents.length > 0 ? filteredAgents.map((agent) => <AgentCard key={agent.id} agent={agent as any} />)
                  : <div className="col-span-full rounded-3xl border border-[#1E1B3A] bg-[#08080F] p-10 text-center text-[#9490B5]">No agents listed yet. Explore builders or create your own AI.</div>}
              </div>
            </>
          )}

          {tab === 'builders' && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {loading ? Array.from({ length: 6 }).map((_, index) => <BuilderCardSkeleton key={index} />)
                : builders.length > 0 ? builders.map(({ profile, builderProfile }) => (
                  <BuilderCard key={profile.id} profile={profile} builderProfile={builderProfile} />
                ))
                : <div className="col-span-full rounded-3xl border border-[#1E1B3A] bg-[#08080F] p-10 text-center text-[#9490B5]">No builders available right now. Check back soon.</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

