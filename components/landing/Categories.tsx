"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const cats = [
  { name: "WhatsApp Bot", g: "from-blue-600/30 to-cyan-500/20" },
  { name: "Voice Assistant", g: "from-purple-600/30 to-fuchsia-500/20" },
  { name: "CRM Integration", g: "from-emerald-600/30 to-teal-500/20" },
  { name: "Lead Capture", g: "from-orange-600/30 to-amber-500/20" },
  { name: "Customer Support",g: "from-teal-600/30 to-cyan-500/20" },
  { name: "Booking System", g: "from-pink-600/30 to-rose-500/20" },
  { name: "Website Builder", g: "from-indigo-600/30 to-violet-500/20" },
  { name: "Custom Agent", g: "from-zinc-600/30 to-neutral-500/20" },
];

export function Categories() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-3xl font-semibold text-foreground">
          Every automation you need.
        </h2>
        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
          {cats.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <Link
                href={`/marketplace?category=${encodeURIComponent(c.name)}`}
                className={`block rounded-xl border border-border bg-gradient-to-br ${c.g} p-5 transition hover:scale-[1.02] hover:border-accent-blue hover:shadow-glow`}
              >
                <p className="font-display font-semibold text-foreground">{c.name}</p>
                <p className="mt-1 text-sm text-foreground-secondary">
                  agents
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
