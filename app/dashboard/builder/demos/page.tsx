import Link from "next/link";
import { format } from "date-fns";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { mapProfileIdsToNames } from "@/lib/dashboard-display";
import type { DemoBooking } from "@/types";

export const dynamic = "force-dynamic";

export default async function BuilderDemosPage() {
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
          Demo calls
        </h1>
        <DashboardEmptyState
          title="Create your builder profile first"
          description="Demo bookings are tied to your builder profile."
          action={{ href: "/dashboard/builder", label: "Go to overview" }}
        />
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("demo_bookings")
    .select("*")
    .eq("builder_id", bp.id)
    .order("scheduled_at", { ascending: false });

  const bookings = (rows as DemoBooking[]) ?? [];
  const businessNames = await mapProfileIdsToNames(
    supabase,
    bookings.map((b) => b.business_id).filter(Boolean) as string[]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Demo calls
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">
          Demos booked with you by businesses. Join links appear when a meeting
          is created.
        </p>
      </div>

      {bookings.length === 0 ? (
        <DashboardEmptyState
          title="No demo calls scheduled"
          description="When a business books a demo with you, it will appear here."
          action={{ href: "/marketplace", label: "View marketplace" }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-bg-secondary/80 text-xs uppercase text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Scheduled</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Host</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id} className="bg-bg-card/40">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {businessNames.get(b.business_id) ?? "Business"}
                  </td>
                  <td className="px-4 py-3 text-foreground-secondary">
                    {format(new Date(b.scheduled_at), "PPp")}
                  </td>
                  <td className="px-4 py-3 capitalize text-foreground-secondary">
                    {b.status}
                  </td>
                  <td className="px-4 py-3">
                    {b.zoom_start_url ? (
                      <a
                        href={b.zoom_start_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-blue hover:underline"
                      >
                        Start meeting
                      </a>
                    ) : b.zoom_join_url ? (
                      <a
                        href={b.zoom_join_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-blue hover:underline"
                      >
                        Join
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
