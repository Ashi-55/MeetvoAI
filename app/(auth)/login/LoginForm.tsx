"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { loginSchema, type LoginValues } from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard/business";
  const [busy, setBusy] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("email not confirmed") ||
          msg.includes("not confirmed")
        ) {
          toast.error(
            "Confirm your email first — check your inbox for the Supabase link, then try again."
          );
          return;
        }
        if (
          msg.includes("invalid login") ||
          msg.includes("invalid credentials")
        ) {
          toast.error(
            "Wrong email or password — or account doesn’t exist yet. Try Sign up or reset password."
          );
          return;
        }
        toast.error(error.message);
        return;
      }
      toast.success("Signed in");
      router.push(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  });

  const google = async () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4 py-16 text-foreground">
      <div className="mb-10 flex items-center gap-2">
        <span className="bg-accent-blue/20 flex h-10 w-10 items-center justify-center rounded-xl font-display text-xl font-bold text-accent-blue">
          M
        </span>
        <span className="font-display text-xl font-semibold">MeetvoAI</span>
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-card p-8 shadow-glow">
        <h1 className="text-center font-display text-2xl font-semibold">
          Welcome back
        </h1>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label
              className="text-sm text-foreground-secondary"
              htmlFor="email"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>
          <div>
            <label
              className="text-sm text-foreground-secondary"
              htmlFor="password"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="mt-1"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={busy}
            variant="primary"
          >
            Sign in
          </Button>
        </form>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-bg-card px-2 text-foreground-muted">or</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => void google()}
        >
          Continue with Google
        </Button>
        <p className="mt-4 text-center text-xs text-foreground-muted">
          If you just signed up, open the confirmation email from Supabase
          before signing in.
        </p>
        <p className="mt-8 text-center text-sm text-foreground-secondary">
          Don&apos;t have an account?{" "}
          <Link className="text-accent-blue hover:underline" href="/signup">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
