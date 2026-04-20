"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className:
          "!bg-bg-card !text-foreground !border !border-border !rounded-lg !shadow-glow",
        duration: 4000,
      }}
    />
  );
}
