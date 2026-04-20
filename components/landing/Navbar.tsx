"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/builders", label: "Builders" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#about", label: "About" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-border/50 bg-bg-primary/75 fixed top-0 z-50 w-full border-b backdrop-blur-[20px]"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-accent-blue/20 flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-bold text-accent-blue">
            M
          </span>
          <span className="font-display text-sm font-semibold text-foreground">
            MeetvoAI
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-foreground-secondary transition hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-foreground-secondary transition hover:bg-bg-hover hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="hover:bg-accent-blue/90 inline-flex h-9 items-center rounded-lg bg-accent-blue px-3 text-sm font-medium text-white shadow-glow transition"
          >
            Get Started
          </Link>
        </div>
        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-border bg-bg-secondary px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-foreground-secondary"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="text-sm">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium text-accent-blue"
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </motion.header>
  );
}
