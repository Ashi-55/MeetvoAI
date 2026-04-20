"use client";

import dynamic from "next/dynamic";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { signupSchema, type SignupValues } from "@/lib/validations/auth";

function strengthScore(password: string): number {
  let s = 0;
  if (password.length >= 8) s += 25;
  if (/[A-Z]/.test(password)) s += 25;
  if (/[0-9]/.test(password)) s += 25;
  if (/[^A-Za-z0-9]/.test(password)) s += 25;
  return s;
}

function SignupPageContent() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirm: "",
    },
  });

  const pwd = form.watch("password") ?? "";

  const onSubmit = form.handleSubmit(async (values) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { full_name: values.fullName, role: "business" },
          emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/callback?next=/signup/role`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Check your email or continue if already confirmed.");
      router.push("/signup/role");
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
        redirectTo: `${origin}/auth/callback?next=/signup/role`,
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
          Create account
        </h1>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-foreground-secondary" htmlFor="fn">
              Full name
            </label>
            <Input id="fn" className="mt-1" {...form.register("fullName")} />
            {form.formState.errors.fullName ? (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.fullName.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm text-foreground-secondary" htmlFor="em">
              Email
            </label>
            <Input
              id="em"
              type="email"
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
            <label className="text-sm text-foreground-secondary" htmlFor="pw">
              Password
            </label>
            <Input
              id="pw"
              type="password"
              className="mt-1"
              {...form.register("password")}
            />
            <div className="mt-2">
              <Progress value={strengthScore(pwd)} />
              <p className="mt-1 text-xs text-foreground-muted">
                Use 8+ chars with uppercase and a number
              </p>
            </div>
            {form.formState.errors.password ? (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <div>
            <label className="text-sm text-foreground-secondary" htmlFor="cf">
              Confirm password
            </label>
            <Input
              id="cf"
              type="password"
              className="mt-1"
              {...form.register("confirm")}
            />
            {form.formState.errors.confirm ? (
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.confirm.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={busy}
            variant="primary"
          >
            Create account
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
        <p className="mt-8 text-center text-sm text-foreground-secondary">
          Already have an account?{" "}
          <Link className="text-accent-blue hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default dynamic(() => Promise.resolve(SignupPageContent), {
  ssr: false,
});
