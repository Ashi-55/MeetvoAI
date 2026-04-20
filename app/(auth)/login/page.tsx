import dynamic from "next/dynamic";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

function LoginPageContent() {
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

export default dynamic(() => Promise.resolve(LoginPageContent), {
  ssr: false,
});
