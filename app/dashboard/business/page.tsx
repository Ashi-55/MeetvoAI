import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function BusinessOverviewPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [projects, studios, demos, convos] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("business_id", user.id),
    supabase
      .from("studio_builds")
      .select("id", { count: "exact", head: true })
      .eq("builder_id", user.id),
    supabase
      .from("demo_bookings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", user.id),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", user.id),
  ]);

  const projectCount = projects.count ?? 0;
  const studioCount = studios.count ?? 0;
  const demoCount = demos.count ?? 0;
  const convoCount = convos.count ?? 0;

  const statLink =
    "block rounded-lg border border-border bg-bg-card p-5 transition hover:border-accent-blue/40";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Overview
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">
          Quick snapshot of your activity on MeetvoAI as a business account.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/business/projects" className={statLink}>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Projects
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-foreground">
            {projectCount}
          </p>
        </Link>
        <Link href="/dashboard/business/studio" className={statLink}>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            AI Builder studio
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-foreground">
            {studioCount}
          </p>
        </Link>
        <Link href="/dashboard/business/demos" className={statLink}>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Demo calls
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-foreground">
            {demoCount}
          </p>
        </Link>
        <Link href="/dashboard/business/messages" className={statLink}>
          <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
            Conversations
          </p>
          <p className="mt-2 font-display text-3xl font-semibold text-foreground">
            {convoCount}
          </p>
        </Link>
      </div>

    </div>
  );
}