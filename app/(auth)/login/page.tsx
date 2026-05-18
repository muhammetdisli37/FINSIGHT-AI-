import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--color-text-secondary)]">Yükleniyor…</div>}>
      <LoginForm />
    </Suspense>
  );
}
