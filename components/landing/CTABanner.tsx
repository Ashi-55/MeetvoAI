import Link from "next/link";

export function CTABanner() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-gradient-to-br from-bg-card to-bg-secondary px-8 py-16 text-center shadow-[0_0_80px_rgba(79,142,247,0.12)]">
        <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
          Ready to automate?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-foreground-secondary">
          Join thousands of Indian businesses already using MeetvoAI.
        </p>
        <Link
          href="/signup"
          className="hover:bg-accent-blue/90 mt-8 inline-flex h-12 items-center rounded-xl bg-accent-blue px-10 text-sm font-semibold text-white shadow-glow transition"
        >
          Get Started Free →
        </Link>
      </div>
    </section>
  );
}
