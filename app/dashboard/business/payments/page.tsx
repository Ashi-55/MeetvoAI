import Link from "next/link";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

export default function BusinessPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Payments
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground-secondary">
          Payment milestones and Razorpay receipts will appear here as the
          payments flow is wired to your projects.
        </p>
      </div>
      <DashboardEmptyState
        title="No payment history in this view yet"
        description="Track spend and invoices through active projects. Complete milestones with your builder to record payments."
        action={{
          href: "/dashboard/business/projects",
          label: "Go to My projects",
        }}
      />
      <p className="text-center text-xs text-foreground-muted">
        Public catalog:{" "}
        <Link href="/marketplace" className="text-accent-blue hover:underline">
          Marketplace
        </Link>
      </p>
    </div>
  );
}
