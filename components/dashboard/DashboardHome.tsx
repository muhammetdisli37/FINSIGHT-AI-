"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { apiJson } from "@/lib/api";
import { useFinScore } from "@/lib/hooks/useFinScore";
import { useGoals } from "@/lib/hooks/useGoals";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { FinScoreGauge } from "@/components/dashboard/FinScoreGauge";
import { SpendingPsychology } from "@/components/dashboard/SpendingPsychology";
import { MonthlySummaryChart } from "@/components/dashboard/MonthlySummaryChart";
import { GoalTracker } from "@/components/dashboard/GoalTracker";
import { GeminiChatPanel } from "@/components/dashboard/GeminiChatPanel";
import { SmartNotifications } from "@/components/dashboard/SmartNotifications";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FALLBACK_ANALYSIS =
  "• Harcamalarınız dengeli bir bantta.\n• 'Diğer' kategorisinde %10 kısım hedefe yardımcı olur.\n• Detaylı analiz güncelleniyor.";

export function DashboardHome({ userId }: { userId: string }) {
  const router = useRouter();
  const { data: txs, loading: txLoading, reload: reloadTxs } = useTransactions(userId);
  const { data: fin, loading: finLoading, reload: reloadFin } = useFinScore(userId);
  const { data: goals, reload: reloadGoals } = useGoals(userId);

  const [analysis, setAnalysis] = useState("FinScore yorumu yükleniyor...");
  const [chatRefreshKey, setChatRefreshKey] = useState(0);
  const [txOpen, setTxOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const activeGoal = useMemo(() => {
    const active = goals.find((g) => g.saved_amount < g.target_amount);
    return active ?? goals[0] ?? null;
  }, [goals]);

  const reloadAnalysis = useCallback(async () => {
    try {
      const res = await apiJson<{ text: string }>("/api/gemini/analyze", {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      });
      setAnalysis(res.text);
    } catch {
      setAnalysis(FALLBACK_ANALYSIS);
    }
  }, [userId]);

  const refreshDashboard = useCallback(async () => {
    try {
      await apiJson(`/api/finscore/refresh?user_id=${encodeURIComponent(userId)}`, { method: "POST" });
    } catch {
      /* backend transaction create already refreshes score */
    }
    await Promise.all([reloadTxs(), reloadFin(), reloadAnalysis()]);
    setChatRefreshKey((k) => k + 1);
    router.refresh();
  }, [reloadAnalysis, reloadFin, reloadTxs, userId, router]);

  useEffect(() => {
    void reloadAnalysis();
  }, [reloadAnalysis, fin?.score]);

  const score = fin?.score ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-xl font-semibold text-white">Ana Panel</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Finansal sağlığınızın özeti</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => setGoalOpen(true)}>
            Hedef ekle
          </Button>
          <Button type="button" onClick={() => setTxOpen(true)}>
            İşlem ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="space-y-8 xl:col-span-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <motion.div
              id="finscore"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="scroll-mt-8 lg:col-span-5"
            >
              <Card className="h-[420px]">
                {finLoading ? (
                  <div className="text-sm text-[var(--color-text-secondary)]">FinScore yükleniyor…</div>
                ) : (
                  <FinScoreGauge score={score} analysis={analysis} />
                )}
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-7">
              <Card className="h-[420px]">
                {txLoading ? (
                  <div className="text-sm text-[var(--color-text-secondary)]">İşlemler yükleniyor…</div>
                ) : (
                  <SpendingPsychology transactions={txs} />
                )}
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-6">
              <Card className="min-h-[380px]">
                {txLoading ? (
                  <div className="text-sm text-[var(--color-text-secondary)]">Özet yükleniyor…</div>
                ) : (
                  <MonthlySummaryChart transactions={txs} />
                )}
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-6">
              <Card className="min-h-[380px]">
                <GoalTracker userId={userId} goal={activeGoal} onAddGoal={() => setGoalOpen(true)} />
              </Card>
            </motion.div>
          </div>

          <Card>
            <div className="mb-3 text-sm font-semibold text-white">Akıllı Bildirimler</div>
            <SmartNotifications userId={userId} />
          </Card>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-4">
          <Card className="h-full min-h-[720px]">
            <GeminiChatPanel key={chatRefreshKey} userId={userId} />
          </Card>
        </motion.div>
      </div>

      <AddTransactionModal
        open={txOpen}
        onOpenChange={setTxOpen}
        userId={userId}
        onCreated={async () => {
          await refreshDashboard();
          toast.success("İşlem kaydedildi");
        }}
      />

      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni hedef</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiJson("/api/goals/", {
                  method: "POST",
                  body: JSON.stringify({
                    user_id: userId,
                    title: goalTitle,
                    target_amount: Number(goalAmount),
                    saved_amount: 0,
                    target_date: goalDate,
                    icon: "🎯",
                  }),
                });
                toast.success("Hedef oluşturuldu");
                setGoalOpen(false);
                setGoalTitle("");
                setGoalAmount("");
                setGoalDate("");
                await refreshDashboard();
                await reloadGoals();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Hedef eklenemedi");
              }
            }}
          >
            <div>
              <Label>Başlık</Label>
              <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} required />
            </div>
            <div>
              <Label>Hedef tutar (₺)</Label>
              <Input value={goalAmount} type="number" onChange={(e) => setGoalAmount(e.target.value)} required />
            </div>
            <div>
              <Label>Bitiş tarihi</Label>
              <Input value={goalDate} type="date" onChange={(e) => setGoalDate(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">
              Kaydet
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
