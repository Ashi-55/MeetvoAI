"use client";

import { motion } from "framer-motion";
import { Calendar, MessageSquare, Rocket } from "lucide-react";

const steps = [
  {
    n: "01",
    title: "Browse or Describe",
    body: "Search ready-made agents by category — or describe what you need in plain language.",
    icon: MessageSquare,
  },
  {
    n: "02",
    title: "Book a Live Demo",
    body: "See the agent working in real-time before you commit. Talk directly with the builder on a Zoom call.",
    icon: Calendar,
  },
  {
    n: "03",
    title: "Deploy with Confidence",
    body: "Buy and deploy instantly. Custom work protected by milestone escrow. Money moves only when you approve.",
    icon: Rocket,
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-3xl font-semibold text-foreground md:text-4xl">
          Simple as a conversation.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-foreground-secondary">
          Describe what you need. We handle the rest.
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.12, duration: 0.45 }}
              className="relative overflow-hidden rounded-2xl border border-border bg-bg-card p-8"
            >
              <span className="text-foreground/[0.06] pointer-events-none absolute right-4 top-2 font-display text-7xl font-bold">
                {s.n}
              </span>
              <s.icon className="h-10 w-10 text-accent-blue" />
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {s.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
