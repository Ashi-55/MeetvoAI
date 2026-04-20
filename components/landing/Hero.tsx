"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const wordVariants = {
  hidden: { opacity: 0, x: 60, filter: "blur(8px)" },
  visible: ({ line, index }: { line: number; index: number }) => ({
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      delay: line === 1 ? 0.15 + index * 1 : 2.5 + index * 0.08,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
};

const line1 = ["Buy", "Build", "Deploy."];
const line2 = ["Automate", "Everything."];

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-32 pt-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(79, 142, 247, 0.12), transparent 50%), radial-gradient(ellipse 60% 40% at 80% 60%, rgba(167, 139, 250, 0.08), transparent 45%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 inline-flex items-center rounded-full border border-accent-orange/40 bg-bg-card/80 px-4 py-1.5 text-xs font-medium text-accent-orange shadow-[0_0_24px_rgba(245,158,11,0.15)]"
      >
        ✦ India's First AI Automation Marketplace
      </motion.div>

      <h1 className="text-center font-display font-bold tracking-tight text-foreground [font-size:clamp(2.5rem,8vw,5.5rem)] leading-[1.05]">
        <span className="block">
          {line1.map((w, i) => (
            <motion.span
              key={w}
              custom={{ line: 1, index: i }}
              initial="hidden"
              animate="visible"
              variants={wordVariants}
              className="inline-block pr-3"
            >
              {w}
            </motion.span>
          ))}
        </span>
        <span className="mt-2 block">
          {line2.map((w, i) => (
            <motion.span
              key={w}
              custom={{ line: 2, index: i }}
              initial="hidden"
              animate="visible"
              variants={wordVariants}
              className="inline-block pr-3"
            >
              {w}
            </motion.span>
          ))}
        </span>
      </h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        className="mx-auto mt-8 max-w-[560px] text-center text-lg leading-relaxed text-foreground-secondary"
      >
        Browse verified AI agents, book live demos, and deploy instantly — or
        hire an expert builder for custom automation. India-first, INR pricing,
        escrow-protected.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.45 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Link
          href="/marketplace"
          className="hover:bg-accent-blue/90 inline-flex h-12 items-center rounded-xl bg-accent-blue px-8 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
        >
          Browse Agents →
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-12 items-center rounded-xl border border-foreground/30 px-8 text-sm font-semibold text-foreground transition hover:bg-foreground hover:text-bg-primary"
        >
          Start Building Free
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-foreground-muted"
      >
        <span>AI Agents</span>
        <span className="h-3 w-px bg-border" />
        <span>Verified Builders</span>
        <span className="h-3 w-px bg-border" />
        <span>Secured via Escrow</span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="relative mt-16 w-full max-w-3xl rounded-2xl border border-border bg-bg-card p-4 shadow-glow"
      >
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
          <div className="h-3 w-3 rounded-full bg-red-400/80" />
          <div className="h-3 w-3 rounded-full bg-amber-400/80" />
          <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
          <span className="ml-4 text-xs text-foreground-muted">
            MeetvoAI — Builder Studio
          </span>
        </div>
        <div className="space-y-3 rounded-lg bg-bg-secondary p-4 text-sm">
          <div className="flex justify-end">
            <span className="rounded-2xl bg-accent-blue/90 px-3 py-2 text-white">
              Build a landing page for my café
            </span>
          </div>
          <div className="flex gap-2 text-foreground-secondary">
            <span className="font-bold text-accent-blue">M</span>
            <p>
              I&apos;ll create a warm, mobile-first one-pager with menu section,
              hours, and map embed…
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
