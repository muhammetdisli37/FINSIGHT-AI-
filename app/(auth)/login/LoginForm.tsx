"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = params.get("error");
    if (!err) return;
    const decoded = decodeURIComponent(err);
    if (decoded === "auth" || decoded === "auth_exchange_failed") {
      toast.error("Oturum açılamadı. Google / URL yönlendirmesi veya Supabase Auth ayarlarını kontrol edin.");
    } else if (decoded === "missing_env") {
      toast.error("Sunucu yapılandırması eksik (Supabase ortam değişkenleri).");
    } else {
      toast.error(decoded);
    }
    const u = new URL(window.location.href);
    u.searchParams.delete("error");
    window.history.replaceState({}, "", u.pathname + u.search);
  }, [params]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex flex-col items-center gap-2">
        <motion.div
          animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)]"
        >
          <Sparkles className="h-7 w-7" />
        </motion.div>
        <div className="text-center text-sm text-[var(--color-text-secondary)]">Finsight AI</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giriş yap</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              const fd = new FormData(e.currentTarget);
              const email = String(fd.get("email"));
              const password = String(fd.get("password"));
              const { error } = await supabase.auth.signInWithPassword({ email, password });
              setLoading(false);
              if (error) {
                toast.error(error.message);
                return;
              }
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) {
                router.replace("/login");
                return;
              }
              const { data: profile } = await supabase
                .from("profiles")
                .select("onboarding_completed")
                .eq("id", user.id)
                .maybeSingle();
              router.replace(profile?.onboarding_completed ? next : "/onboarding");
            }}
          >
            <div>
              <Label>E-posta</Label>
              <Input name="email" type="email" autoComplete="email" required />
            </div>
            <div>
              <Label>Şifre</Label>
              <Input name="password" type="password" autoComplete="current-password" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Giriş…" : "Giriş yap"}
            </Button>
          </form>

          <Button
            type="button"
            variant="secondary"
            className="mt-3 w-full"
            onClick={async () => {
              const origin = window.location.origin;
              const { error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
              });
              if (error) toast.error(error.message);
            }}
          >
            Google ile devam et
          </Button>

          <div className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
            Hesabın yok mu? <Link className="text-[var(--color-accent-primary)]" href="/register">Kayıt ol</Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
