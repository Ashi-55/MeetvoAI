"use client";

import dynamic from "next/dynamic";
import { Building2, Code2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { UserRole } from "@/types";

function SignupRolePageContent() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const choose = async (role: UserRole) => {
    if (role !== "business" && role !== "builder") return;
    setBusy(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first.");
        router.push("/login?next=/signup/role");
        return;
      }

      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const fullName =
        (typeof meta?.full_name === "string" && meta.full_name) ||
        (typeof meta?.name === "string" && meta.name) ||
        "";
      const { error: pe } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          role,
          email: user.email ?? null,
          full_name: fullName,
        },
        { onConflict: "id" }
      );
      if (pe) {
        toast.error(pe.message);
        return;
      }

      if (role === "builder") {
        const { error: be } = await supabase
          .from("builder_profiles")
          .upsert({ user_id: user.id }, { onConflict: "user_id" });
        if (be) {
          toast.error(be.message);
          return;
        }
      }

      toast.success("Role saved");
      router.push(
        role === "builder" ? "/dashboard/builder" : "/dashboard/business"
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 py-16 text-foreground">
      <h1 className="mb-2 font-display text-2xl font-semibold">
        How will you use MeetvoAI?
      </h1>
      <p className="mb-10 max-w-md text-center text-foreground-secondary">
        Choose a role to personalize your dashboard. You can contact support to
        change this later.
      </p>
      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
        <Card className="cursor-pointer transition hover:border-accent-blue hover:shadow-glow">
          <CardContent className="flex flex-col gap-4 p-8">
            <Building2 className="h-10 w-10 text-accent-blue" />
            <h2 className="font-display text-xl font-semibold">
              I&apos;m a Business
            </h2>
            <p className="text-sm text-foreground-secondary">
              Browse agents, book demos, hire builders, and deploy AI
              automation.
            </p>
            <Button
              type="button"
              variant="primary"
              disabled={busy}
              onClick={() => void choose("business")}
            >
              Continue as Business
            </Button>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition hover:border-accent-blue hover:shadow-glow">
          <CardContent className="flex flex-col gap-4 p-8">
            <Code2 className="h-10 w-10 text-accent-purple" />
            <h2 className="font-display text-xl font-semibold">
              I&apos;m a Builder
            </h2>
            <p className="text-sm text-foreground-secondary">
              Build and sell AI agents, take custom projects, and earn in INR.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void choose("builder")}
            >
              Continue as Builder
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default dynamic(() => Promise.resolve(SignupRolePageContent), {
  ssr: false,
});
