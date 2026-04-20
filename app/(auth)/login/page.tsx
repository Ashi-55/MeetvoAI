import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen animate-pulse bg-bg-primary" aria-hidden />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
