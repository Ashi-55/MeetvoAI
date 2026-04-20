import Link from "next/link";
import { format } from "date-fns";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { mapBuilderProfileIdsToNames } from "@/lib/dashboard-display";
import type { Conversation } from "@/types";

export const dynamic = "force-dynamic";

export default async function BusinessMessagesPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("conversations")
    .select("id, last_message_at, builder_id, created_at")
    .eq("business_id", user.id)
    .order("last_message_at", { ascending: false });

  const conversations = (rows as Pick<
    Conversation,
    "id" | "last_message_at" | "builder_id" | "created_at"
  >[]) ?? [];

  const builderNames = await mapBuilderProfileIdsToNames(
    supabase,
    conversations.map((c) => c.builder_id).filter(Boolean) as string[]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Messages
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">
          Conversations with builders you are working with. Full threaded chat
          is coming soon — for now you can see each thread and when it was last
          active.
        </p>
      </div>

      {conversations.length === 0 ? (
        <DashboardEmptyState
          title="No conversations yet"
          description="Start a project or book a demo with a builder to open a message thread."
          action={{ href: "/builders", label: "Browse builders" }}
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
                  {c.builder_id
                    ? (builderNames.get(c.builder_id) ?? "Builder")
                    : "Conversation"}
                </p>
                <p className="text-xs text-foreground-muted">
                  Started {format(new Date(c.created_at), "PP")}
                </p>
              </div>
              <p className="text-sm text-foreground-secondary">
                Last activity{" "}
                {format(new Date(c.last_message_at), "PPp")}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-foreground-muted">
        Need help? Visit the{" "}
        <Link href="/marketplace" className="text-accent-blue hover:underline">
          marketplace
        </Link>{" "}
        to discover builders and agents.
      </p>
    </div>
  );
}
