import { DealPipeline } from "@/components/dashboard/DealPipeline";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

export default async function BusinessProjectsPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("business_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        My projects
      </h1>
      <p className="max-w-2xl text-sm text-foreground-secondary">
        Kanban view of your deals. Drag cards between columns to update status
        (coming soon) — for now, status updates via API when you complete
        milestones.
      </p>
      <DealPipeline projects={(projects as Project[]) ?? []} />
    </div>
  );
}
