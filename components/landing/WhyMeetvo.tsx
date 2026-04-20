import { Shield, IndianRupee, Video, UserCheck } from "lucide-react";

const items = [
  {
    title: "Verified Builders Only",
    body: "Every builder passes identity verification, skill testing, and live agent review before appearing on the platform.",
    icon: UserCheck,
    color: "bg-accent-blue/15 text-accent-blue",
  },
  {
    title: "Escrow Protection",
    body: "Your money never reaches the builder until you approve the work. Milestone-based payments, zero risk.",
    icon: Shield,
    color: "bg-accent-green/15 text-accent-green",
  },
  {
    title: "Demo Before You Pay",
    body: "Watch the actual agent working live in a Zoom call. See real output, not screenshots.",
    icon: Video,
    color: "bg-accent-purple/15 text-accent-purple",
  },
  {
    title: "India-First Pricing",
    body: "INR pricing, UPI payments, WhatsApp-native workflows. Built for how Indian businesses actually operate.",
    icon: IndianRupee,
    color: "bg-accent-orange/15 text-accent-orange",
  },
];

export function WhyMeetvo() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center font-display text-3xl font-semibold text-foreground">
          Why MeetvoAI
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-border bg-bg-card p-8"
            >
              <div
                className={`inline-flex rounded-lg p-3 ${it.color}`}
              >
                <it.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                {it.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
