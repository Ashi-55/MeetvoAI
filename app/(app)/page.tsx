'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Globe2,
  Layers3,
  Lock,
  MessageSquare,
  Mic,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Workflow,
  Zap,
} from 'lucide-react';

const sections = {
  problems: [
    ['AI feels expensive and unclear', 'Most SMBs know AI can help, but not what to build first or who to trust.'],
    ['Builders need serious buyers', 'Good AI builders waste time chasing scattered leads instead of shipping paid work.'],
    ['Delivery needs trust', 'Escrow, scope clarity, messaging, and status tracking need to live in one place.'],
  ],
  categories: ['WhatsApp automation', 'Voice agents', 'AI websites', 'Booking systems', 'Lead generation', 'CRM workflows', 'Support chatbots', 'Custom AI systems'],
  faqs: [
    ['Is MeetvoAI for non-technical businesses?', 'Yes. A business owner can describe the problem in plain language and either generate a plan in AI Studio or connect with a verified builder who can deliver it.'],
    ['How does escrow work?', 'Payment is held while the builder works. Funds are released after the buyer approves delivery.'],
    ['Can builders publish agents?', 'Yes. Builders can create, publish, and sell AI agents while managing deals and messages from the dashboard.'],
    ['What can AI Studio generate?', 'AI Studio can generate automation plans, website previews, workflows, deployment structure, and recommended builder handoff details.'],
  ],
};

function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#00C2A8]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-text sm:text-4xl lg:text-5xl">{title}</h2>
      {body && <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-text2">{body}</p>}
    </div>
  );
}

function StudioMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="premium-card relative overflow-hidden rounded-[24px] p-4 sm:p-5"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00C2A8] to-transparent" />
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-sm font-bold text-text">AI Studio</p>
          <p className="text-xs text-text2">Real-time business build plan</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#00C2A8]/30 bg-[#00C2A8]/10 px-3 py-1 text-xs font-bold text-[#00C2A8]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#00C2A8]" />
          Generating
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-border bg-surface2 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs text-text2">
          <Mic size={14} className="text-[#00C2A8]" />
          Prompt
        </div>
        <p className="text-lg font-semibold text-text">&quot;My clinic misses appointments&quot;</p>
      </div>

      <div className="mt-5 grid gap-3">
        {[
          ['WhatsApp automation', 'Reminder messages, reschedule links, patient intake'],
          ['Booking system', 'Doctor slots, confirmation flow, cancellation guardrails'],
          ['Website suggestion', 'Clinic landing page with appointment CTA'],
          ['Recommended builder', 'Healthcare automation specialist, replies in 4h'],
        ].map(([title, body], index) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.35 + index * 0.1 }}
            className="rounded-[18px] border border-border bg-surface p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#5B5EF7]/16 text-[#8EA0FF]">
                {index === 0 ? <MessageSquare size={16} /> : index === 1 ? <Clock size={16} /> : index === 2 ? <Globe2 size={16} /> : <BadgeCheck size={16} />}
              </div>
              <div>
                <p className="text-sm font-bold text-text">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-text2">{body}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {['Workflow', 'Preview', 'Handoff'].map((item) => (
          <div key={item} className="rounded-[16px] border border-border bg-surface2 p-3 text-center text-xs font-bold text-text2">{item}</div>
        ))}
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <div className="premium-shell min-h-screen overflow-hidden text-text">
      <section id="home" className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-12 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8">
        <div className="absolute inset-x-4 bottom-0 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent lg:block" />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text2">
            <Sparkles size={15} className="text-[#00C2A8]" />
            AI adoption platform for SMBs and builders
          </div>
          <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.05em] text-text sm:text-6xl lg:text-[78px]">
            Describe your business problem. AI builds it. Or connect with one who can.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text2">
            MeetvoAI helps businesses adopt AI while helping AI builders find serious clients, manage delivery, and get paid through protected workflows.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/studio" className="premium-button inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold">
              Start Building <ArrowRight size={18} />
            </Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-border bg-surface px-6 py-4 text-sm font-bold text-text transition hover:border-[#00C2A8]/50 hover:bg-surface2">
              Connect With One Who Can <Search size={18} />
            </Link>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {['Escrow protected', 'Verified builders', 'AI-native studio'].map((item) => (
              <div key={item} className="rounded-[18px] border border-border bg-surface p-4 text-sm font-semibold text-text2">{item}</div>
            ))}
          </div>
        </motion.div>
        <StudioMockup />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[24px] border border-border bg-surface p-4 sm:grid-cols-4">
          {[
            ['SMB-first', 'Plain-language AI adoption'],
            ['Escrow', 'Protected project payments'],
            ['Studio', 'Generate workflows instantly'],
            ['Marketplace', 'Trusted builders and agents'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-[20px] border border-border bg-surface2 p-5">
              <p className="text-xl font-black text-text">{title}</p>
              <p className="mt-2 text-sm leading-6 text-text2">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="The Problem" title="AI adoption is still too confusing for real businesses." body="MeetvoAI turns vague operational pain into scoped AI work, trusted delivery, and measurable outcomes." />
        <div className="grid gap-5 md:grid-cols-3">
          {sections.problems.map(([title, body], index) => (
            <motion.div key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className="premium-card rounded-[20px] p-6">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#5B5EF7]/15 text-[#8EA0FF]">{index + 1}</div>
              <h3 className="text-xl font-black text-text">{title}</h3>
              <p className="mt-3 leading-7 text-text2">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="How MeetvoAI Works" title="One system for idea, build, trust, and delivery." />
        <div className="grid gap-5 lg:grid-cols-4">
          {[
            [Sparkles, 'Describe', 'Tell AI what your business needs in natural language.'],
            [Workflow, 'Generate', 'Get an automation plan, website preview, and workflow map.'],
            [BriefcaseBusiness, 'Build or connect', 'Continue in Studio or connect with a verified builder who can deliver it.'],
            [ShieldCheck, 'Approve', 'Track delivery and release payment after approval.'],
          ].map(([Icon, title, body]) => {
            const StepIcon = Icon as typeof Sparkles;
            return (
              <div key={title as string} className="rounded-[20px] border border-border bg-surface p-6">
                <StepIcon className="text-[#00C2A8]" size={24} />
                <h3 className="mt-5 text-xl font-black text-text">{title as string}</h3>
                <p className="mt-3 text-sm leading-6 text-text2">{body as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#00C2A8]">AI Studio Showcase</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] text-text lg:text-6xl">Perplexity-simple. Canva-visual. Vercel-fast.</h2>
            <p className="mt-5 text-lg leading-8 text-text2">AI Studio is the product wedge: prompt, voice, multilingual input, workflow nodes, generated previews, and a clean deploy path.</p>
            <Link href="/studio" className="mt-8 inline-flex items-center gap-2 rounded-[14px] bg-[#5B5EF7] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#4B4EE8]">
              Open AI Studio <ArrowRight size={16} />
            </Link>
          </div>
          <div className="premium-card rounded-[24px] p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                [Bot, 'AI suggestions', 'Next best automations and missing business details.'],
                [Layers3, 'Visual nodes', 'Inputs, actions, APIs, approvals, and deployment steps.'],
                [Globe2, 'Website preview', 'Instant landing page and booking flow mockup.'],
                [Zap, 'Automation preview', 'WhatsApp, CRM, payments, and notifications.'],
              ].map(([Icon, title, body]) => {
                const CardIcon = Icon as typeof Bot;
                return (
                  <div key={title as string} className="rounded-[18px] border border-border bg-surface2 p-5">
                    <CardIcon size={22} className="text-[#00C2A8]" />
                    <p className="mt-4 font-black text-text">{title as string}</p>
                    <p className="mt-2 text-sm leading-6 text-text2">{body as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="marketplace" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Marketplace" title="Premium builder discovery with the trust signals SMBs need." />
        <div className="grid gap-5 lg:grid-cols-3">
          {['WhatsApp automation expert', 'Voice agent builder', 'AI website studio'].map((title, index) => (
            <div key={title} className="premium-card rounded-[20px] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B5EF7]/15 text-xl font-black text-text">{['A', 'K', 'M'][index]}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-text">{title}</h3>
                    <BadgeCheck size={16} className="text-[#00C2A8]" />
                  </div>
                  <p className="mt-1 text-sm text-text2">Replies in {index + 2}h · English, Hindi</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-sm text-text2">
                <Star size={15} className="fill-[#F59E0B] text-[#F59E0B]" /> 4.{9 - index} · {24 + index * 11} completed projects
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {['Verified', 'Escrow ready', 'Healthcare'].map((tag) => <span key={tag} className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs font-semibold text-text2">{tag}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="premium-card rounded-[24px] p-8">
            <Lock className="text-[#00C2A8]" size={28} />
            <h2 className="mt-5 text-3xl font-black text-text">Escrow and trust are built into the workflow.</h2>
            <p className="mt-4 leading-7 text-text2">Buyers get confidence before payment. Builders get clarity before delivery. Admins get an operations view for payments, disputes, and moderation.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {sections.categories.map((item) => (
              <div key={item} className="rounded-[18px] border border-border bg-surface p-4 text-sm font-bold text-text">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Pricing" title="Plans for businesses, builders, and enterprise teams." />
        <div className="grid gap-5 lg:grid-cols-3">
          {[
            ['Business', 'Start adopting AI with Studio and marketplace access.', '₹2,999/mo'],
            ['Builder', 'Publish agents, manage clients, and earn through escrow.', '₹1,999/mo'],
            ['Enterprise', 'Custom workflows, governance, and premium support.', 'Custom'],
          ].map(([title, body, price], index) => (
            <div key={title} className={`rounded-[20px] border p-6 ${index === 1 ? 'border-[#5B5EF7]/60 bg-[#5B5EF7]/10' : 'border-border bg-surface'}`}>
              <p className="text-xl font-black text-text">{title}</p>
              <p className="mt-3 text-sm leading-6 text-text2">{body}</p>
              <p className="mt-6 text-3xl font-black text-text">{price}</p>
              <Link href="/pricing" className="mt-6 inline-flex w-full items-center justify-center rounded-[14px] bg-text px-4 py-3 text-sm font-black text-page transition hover:opacity-90">View plans</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Proof" title="Built to feel serious before the first sales call." />
        <div className="grid gap-5 lg:grid-cols-3">
          {['The first AI tool I could explain to my clinic team.', 'Escrow made connecting with a builder feel safe.', 'Finally a place where AI builders can look credible.'].map((quote) => (
            <div key={quote} className="rounded-[20px] border border-border bg-surface p-6">
              <p className="leading-7 text-text2">&quot;{quote}&quot;</p>
              <div className="mt-5 flex items-center gap-2 text-sm font-bold text-text"><Check size={16} className="text-[#00C2A8]" /> Early user feedback</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="FAQ" title="Clear answers for buyers, builders, and investors." />
        <div className="space-y-3">
          {sections.faqs.map(([question, answer]) => (
            <details key={question} className="group rounded-[18px] border border-border bg-surface p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-black text-text">
                {question}
                <ChevronDown className="shrink-0 text-text2 transition group-open:rotate-180" size={18} />
              </summary>
              <p className="mt-4 leading-7 text-text2">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="premium-card rounded-[28px] p-8 text-center sm:p-12">
          <Play className="mx-auto text-[#00C2A8]" size={28} />
          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-[-0.04em] text-text lg:text-6xl">Turn AI curiosity into a live business system.</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/studio" className="premium-button inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold">Start Building <ArrowRight size={18} /></Link>
            <Link href="/marketplace" className="inline-flex items-center justify-center rounded-[14px] border border-border bg-surface px-6 py-4 text-sm font-bold text-text hover:bg-surface2">Connect With One Who Can</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-black text-text">Meetvo<span className="text-[#00C2A8]">AI</span></p>
            <p className="mt-2 text-sm text-text2">AI adoption, verified builder connections, and protected delivery.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-semibold text-text2">
            <Link href="/studio" className="hover:text-text">Studio</Link>
            <Link href="/marketplace" className="hover:text-text">Marketplace</Link>
            <Link href="/pricing" className="hover:text-text">Pricing</Link>
            <Link href="/signup" className="hover:text-text">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
