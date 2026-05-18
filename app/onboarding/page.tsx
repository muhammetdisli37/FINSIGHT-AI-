"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const goalOptions = [
  { id: "Birikim yapmak", label: "Birikim yapmak" },
  { id: "Borç ödemek", label: "Borç ödemek" },
  { id: "Tatil fonu", label: "Tatil fonu" },
  { id: "Yatırım", label: "Yatırım" },
  { id: "Emeklilik", label: "Emeklilik" },
];

const budgetCategories = ["Konut", "Yeme & İçme", "Ulaşım", "Eğlence", "Alışveriş", "Sağlık", "Diğer"];

export default function OnboardingPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [limits, setLimits] = useState<Record<string, number>>(() =>
    Object.fromEntries(budgetCategories.map((c) => [c, 3000])),
  );

  const [gTitle, setGTitle] = useState("İlk hedefim");
  const [gAmount, setGAmount] = useState("10000");
  const [gDate, setGDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (profile?.onboarding_completed) {
        router.replace("/");
        return;
      }
      setName(profile?.full_name?.split(" ")[0] ?? "Merhaba");
      const d = new Date();
      d.setMonth(d.getMonth() + 3);
      setGDate(d.toISOString().slice(0, 10));
    });
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const finish = async () => {
    if (!userId) return;
    try {
      await apiJson(`/api/onboarding/seed-default-categories?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
      });

      const rows = budgetCategories.map((c) => ({
        user_id: userId,
        category: c,
        limit_amount: limits[c] ?? 0,
      }));
      const { error: bErr } = await supabase.from("user_category_budgets").upsert(rows, {
        onConflict: "user_id,category",
      });
      if (bErr) throw new Error(bErr.message);

      await apiJson("/api/goals/", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          title: gTitle,
          target_amount: Number(gAmount),
          saved_amount: 0,
          target_date: gDate,
          icon: "🎯",
        }),
      });

      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          financial_goals: selectedGoals,
        })
        .eq("id", userId);

      await apiJson("/api/finscore/refresh?user_id=" + encodeURIComponent(userId), { method: "POST" });

      toast.success("Hazırsın!");
      router.replace("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Onboarding tamamlanamadı");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="text-sm text-[var(--color-text-secondary)]">Adım {step} / 3</div>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h1 className="text-2xl font-semibold text-white">
              Merhaba {name}! Finansal hedeflerin neler?
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Birden fazla seçebilirsin.</p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {goalOptions.map((g) => {
                const active = selectedGoals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    className={`rounded-2xl border p-4 text-left text-sm transition ${
                      active
                        ? "border-[var(--color-accent-primary)] bg-[#16161f]"
                        : "border-white/10 bg-[#0d0d14] hover:border-white/20"
                    }`}
                  >
                    <div className="font-semibold text-white">{g.label}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={async () => {
                if (userId) {
                  await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", userId);
                  router.replace("/");
                }
              }}>Atla ve Panele Git</Button>
              <Button type="button" onClick={() => setStep(2)} disabled={selectedGoals.length === 0}>
                Devam
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 className="text-xl font-semibold text-white">Aylık bütçe limitleri</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Kategori bazlı limit (₺)</p>
            <div className="mt-6 space-y-5">
              {budgetCategories.map((c) => (
                <Card key={c} className="p-4">
                  <div className="mb-2 flex items-center justify-between text-sm text-white">
                    <span>{c}</span>
                    <span className="text-[var(--color-text-secondary)]">{limits[c]}₺</span>
                  </div>
                  <Slider
                    value={[limits[c]]}
                    min={500}
                    max={20000}
                    step={100}
                    onValueChange={(v) => setLimits((prev) => ({ ...prev, [c]: v[0] ?? 0 }))}
                  />
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                Geri
              </Button>
              <Button type="button" onClick={() => setStep(3)}>
                Devam
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 className="text-xl font-semibold text-white">İlk hedefini ekle</h2>
            <div className="mt-6 space-y-3">
              <div>
                <Label>Başlık</Label>
                <Input value={gTitle} onChange={(e) => setGTitle(e.target.value)} />
              </div>
              <div>
                <Label>Hedef tutar (₺)</Label>
                <Input value={gAmount} onChange={(e) => setGAmount(e.target.value)} type="number" />
              </div>
              <div>
                <Label>Tarih</Label>
                <Input value={gDate} onChange={(e) => setGDate(e.target.value)} type="date" />
              </div>
            </div>
            <div className="mt-6 flex justify-between">
              <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                Geri
              </Button>
              <Button type="button" onClick={() => void finish()}>
                Bitir ve panele git
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
