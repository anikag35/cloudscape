"use client";

import { ToastProvider } from "@/components/Toast";
import ErrorBoundary from "@/components/ErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallbackMessage="Cloudscape encountered an error">
      <ToastProvider>{children}</ToastProvider>
    </ErrorBoundary>
  );
}
