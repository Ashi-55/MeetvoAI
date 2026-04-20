import { MarketplaceView } from "@/components/marketplace/MarketplaceView";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Agent } from "@/types";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  let agents: Agent[] = [];
  try {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from("agents")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(48);

    if (searchParams.category) {
      query = query.eq("category", searchParams.category);
    }

    const { data } = await query;
    agents = (data as Agent[]) ?? [];
  } catch {
    agents = [];
  }

  return (
    <main className="min-h-screen bg-bg-primary px-4 pb-24 pt-24 text-foreground">
      <MarketplaceView agents={agents} />
    </main>
  );
}
