import Link from "next/link";
import { format } from "date-fns";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { mapProfileIdsToNames } from "@/lib/dashboard-display";
import type { Conversation } from "@/types";

export default async function BuilderMessagesPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bp } = await supabase
    .from("builder_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!bp?.id) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Messages
        </h1>
        <DashboardEmptyState
          title="Create your builder profile first"
          description="Conversations are linked to your builder profile."
          action={{ href: "/dashboard/builder", label: "Go to overview" }}
        />
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("conversations")
    .select("id, last_message_at, business_id, created_at")
    .eq("builder_id", bp.id)
    .order("last_message_at", { ascending: false });

  const conversations = (rows as Pick<
    Conversation,
    "id" | "last_message_at" | "business_id" | "created_at"
  >[]) ?? [];

  const businessNames = await mapProfileIdsToNames(
    supabase,
    conversations.map((c) => c.business_id).filter(Boolean) as string[]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Messages
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">
          Threads with businesses. Full chat UI is coming soon.
        </p>
      </div>

      {conversations.length === 0 ? (
        <DashboardEmptyState
          title="No conversations yet"
          description="When a business starts a project or reaches out, their thread will show here."
          action={{ href: "/dashboard/builder/projects", label: "My projects" }}
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-bg-card/40">
          {conversations.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-foreground">
                  {c.business_id
                    ? (businessNames.get(c.business_id) ?? "Business")
                    : "Conversation"}
                </p>
                <p className="text-xs text-foreground-muted">
                  Started {format(new Date(c.created_at), "PP")}
                </p>
              </div>
              <p className="text-sm text-foreground-secondary">
                Last activity {format(new Date(c.last_message_at), "PPp")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-foreground-muted">
        <Link href="/marketplace" className="text-accent-blue hover:underline">
          Marketplace
        </Link>
      </p>
    </div>
  );
}
