"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6 flex flex-col items-center gap-2">
        <motion.div
          animate={{ rotate: [0, -6, 6, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-primary)]"
        >
          <Sparkles className="h-7 w-7" />
        </motion.div>
        <div className="text-center text-sm text-[var(--color-text-secondary)]">Finsight AI</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kayıt ol</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              const fd = new FormData(e.currentTarget);
              const full_name = String(fd.get("full_name"));
              const email = String(fd.get("email"));
              const password = String(fd.get("password"));
              const monthly_income = Number(fd.get("monthly_income"));
              const origin = window.location.origin;
              const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: { full_name },
                  emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
                },
              });
              setLoading(false);
              if (error) {
                toast.error(error.message);
                return;
              }
              if (!data.session) {
                toast.success(
                  "Kayıt alındı. Hesabı etkinleştirmek için e-postanızdaki onay bağlantısına tıklayın; ardından giriş yapın.",
                );
                router.replace("/login");
                return;
              }
              const user = data.user;
              if (!user) {
                toast.error("Oturum oluşturulamadı. Lütfen tekrar deneyin.");
                return;
              }
              const income = Number.isFinite(monthly_income) && monthly_income >= 0 ? monthly_income : 0;
              const { error: pErr } = await supabase.from("profiles").upsert(
                {
                  id: user.id,
                  full_name: full_name.trim(),
                  email,
                  monthly_income: income,
                  onboarding_completed: true,
                },
                { onConflict: "id" },
              );
              if (pErr) {
                toast.error(
                  pErr.message.includes("row-level security") || pErr.message.includes("RLS")
                    ? "Profil kaydı güncellenemedi. Supabase SQL ile profiles_insert_own politikasını ekleyin (projede sql/profiles_insert_own_policy.sql)."
                    : pErr.message,
                );
                return;
              }
              toast.success("Kayıt başarılı — panele yönlendiriliyorsunuz");
              router.replace("/");
            }}
          >
            <div>
              <Label>Ad Soyad</Label>
              <Input name="full_name" required />
            </div>
            <div>
              <Label>E-posta</Label>
              <Input name="email" type="email" required />
            </div>
            <div>
              <Label>Şifre</Label>
              <Input name="password" type="password" minLength={6} required />
            </div>
            <div>
              <Label>Aylık gelir (₺)</Label>
              <Input name="monthly_income" type="number" step="1" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Kaydediliyor…" : "Kayıt ol"}
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
                options: { redirectTo: `${origin}/auth/callback?next=/onboarding` },
              });
              if (error) toast.error(error.message);
            }}
          >
            Google ile devam et
          </Button>

          <div className="mt-4 text-center text-xs text-[var(--color-text-secondary)]">
            Zaten hesabın var mı? <Link className="text-[var(--color-accent-primary)]" href="/login">Giriş yap</Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
