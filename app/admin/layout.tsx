import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 text-foreground">
        <p className="text-lg">Admin access only.</p>
        <Link href="/" className="mt-4 text-accent-blue hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-foreground">
      <header className="border-b border-border bg-bg-secondary px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center gap-8">
          <span className="font-display font-semibold">MeetvoAI Admin</span>
          <nav className="flex gap-4 text-sm text-foreground-secondary">
            <Link className="hover:text-foreground" href="/admin">
              Overview
            </Link>
            <Link className="hover:text-foreground" href="/admin/builders">
              Builders
            </Link>
            <Link className="hover:text-foreground" href="/admin/disputes">
              Disputes
            </Link>
            <Link className="hover:text-foreground" href="/admin/transactions">
              Transactions
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
