"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiJson } from "@/lib/api";
import { useGoals } from "@/lib/hooks/useGoals";
import type { Goal } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GoalsScreen({ userId }: { userId: string }) {
  const { data, reload } = useGoals(userId);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  const selectedGoal = useMemo(() => data.find((g) => g.id === selected) ?? null, [data, selected]);

  const progress = (g: (typeof data)[number]) =>
    g.target_amount > 0 ? Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100)) : 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">Hedefler</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">İlerleme, tahmin ve katkı</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setAddOpen(true)}>
          Yeni hedef
        </Button>
      </motion.div>

      {data.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-10 text-center text-sm text-[var(--color-text-secondary)]"
        >
          Henüz hedef yok.
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-3xl">{g.icon ?? "🎯"}</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSelected(g.id);
                      setAmount("");
                    }}
                  >
                    Para ekle
                  </Button>
                </div>
                <div className="mt-3 text-base font-semibold text-white">{g.title}</div>
                <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  Kalan süre: {Math.max(0, Math.ceil((new Date(g.target_date).getTime() - Date.now()) / 86400000))} gün
                </div>
                <motion.div key={progress(g)} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 text-3xl font-bold gradient-text">
                  {progress(g)}%
                </motion.div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress(g)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)" }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs text-[var(--color-text-secondary)]">
                  <div>
                    <div>Hedef</div>
                    <div className="text-white">{g.target_amount.toLocaleString("tr-TR")}₺</div>
                  </div>
                  <div className="text-right">
                    <div>Biriken</div>
                    <div className="text-white">{g.saved_amount.toLocaleString("tr-TR")}₺</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Parayı hedefe ekle</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const prev = selectedGoal.saved_amount;
                  const updated = await apiJson<Goal>(
                    `/api/goals/${selectedGoal.id}/add?user_id=${encodeURIComponent(userId)}`,
                    { method: "POST", body: JSON.stringify({ amount: Number(amount) }) },
                  );
                  await reload();
                  if (updated.saved_amount >= updated.target_amount && prev < selectedGoal.target_amount) {
                    setCelebrateId(selectedGoal.id);
                    window.setTimeout(() => setCelebrateId(null), 2500);
                  }
                  toast.success("Güncellendi");
                  setSelected(null);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Hata");
                }
              }}
            >
              <div className="text-sm text-[var(--color-text-secondary)]">{selectedGoal.title}</div>
              <div>
                <Label>Tutar (₺)</Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" required />
              </div>
              <Button type="submit" className="w-full gradient">
                Ekle
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni hedef</DialogTitle>
          </DialogHeader>
          <GoalCreateForm
            userId={userId}
            onDone={async () => {
              await reload();
              setAddOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {celebrateId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center shadow-xl shadow-[var(--glow-primary)]"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-6xl"
              >
                🎉
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 text-2xl font-semibold gradient-text"
              >
                Tebrikler!
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-2 text-sm text-[var(--color-text-secondary)]"
              >
                Hedefini tamamladın.
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GoalCreateForm({ userId, onDone }: { userId: string; onDone: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().slice(0, 10);
  });

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        await apiJson("/api/goals/", {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            title,
            target_amount: Number(target),
            saved_amount: 0,
            target_date: date,
            icon: "🎯",
          }),
        });
        await onDone();
      }}
    >
      <div>
        <Label>Başlık</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <Label>Hedef tutar</Label>
        <Input value={target} onChange={(e) => setTarget(e.target.value)} type="number" required />
      </div>
      <div>
        <Label>Tarih</Label>
        <Input value={date} onChange={(e) => setDate(e.target.value)} type="date" required />
      </div>
      <Button type="submit" className="w-full gradient">
        Oluştur
      </Button>
    </form>
  );
}
