"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "./AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors theme="dark" position="top-center" />
    </AuthProvider>
  );
}
