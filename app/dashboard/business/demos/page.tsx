import Link from "next/link";
import { format } from "date-fns";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { mapBuilderProfileIdsToNames } from "@/lib/dashboard-display";
import type { DemoBooking } from "@/types";

export default async function BusinessDemosPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("demo_bookings")
    .select("*")
    .eq("business_id", user.id)
    .order("scheduled_at", { ascending: false });

  const bookings = (rows as DemoBooking[]) ?? [];
  const builderNames = await mapBuilderProfileIdsToNames(
    supabase,
    bookings.map((b) => b.builder_id).filter(Boolean) as string[]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Demo calls
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">
          Live demos you book with builders appear here. Book from the public{" "}
          <Link href="/marketplace" className="text-accent-blue hover:underline">
            marketplace
          </Link>{" "}
          or{" "}
          <Link href="/builders" className="text-accent-blue hover:underline">
            browse builders
          </Link>
          .
        </p>
      </div>

      {bookings.length === 0 ? (
        <DashboardEmptyState
          title="No demo calls yet"
          description="When you schedule a demo with a builder, it will show up in this list with time, status, and join link."
          action={{ href: "/marketplace", label: "Browse marketplace" }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-bg-secondary/80 text-xs uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Builder</th>
                <th className="px-4 py-3 font-medium">Scheduled</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Join</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id} className="bg-bg-card/40">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {builderNames.get(b.builder_id) ?? "Builder"}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {format(new Date(b.scheduled_at), "PPp")}
                  </td>
                  <td className="px-4 py-3 capitalize text-foreground-secondary">
                    {b.status}
                  </td>
                  <td className="px-4 py-3">
                    {b.zoom_join_url ? (
                      <a
                        href={b.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-blue hover:underline"
                      >
                        Open Zoom
                      </a>
                    ) : (
                      <span className="text-foreground-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
