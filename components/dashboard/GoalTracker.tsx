"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Smartphone, Target, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api";
import type { Goal } from "@/types";

function GoalAvatar({ goal }: { goal: Goal }) {
  const title = goal.title.toLowerCase();
  if (goal.icon && goal.icon !== "🎯") {
    return <span className="text-2xl">{goal.icon}</span>;
  }
  if (title.includes("telefon") || title.includes("phone")) {
    return <Smartphone className="h-5 w-5 text-[var(--color-accent-primary)]" />;
  }
  return <Target className="h-5 w-5 text-[var(--color-accent-primary)]" />;
}

export function GoalTracker({
  userId,
  goal,
  onAddGoal,
}: {
  userId: string;
  goal: Goal | null;
  onAddGoal: () => void;
}) {
  const [probability, setProbability] = useState<number | null>(null);

  const progress = useMemo(() => {
    if (!goal || goal.target_amount <= 0) return 0;
    return Math.min(100, Math.round((goal.saved_amount / goal.target_amount) * 100));
  }, [goal]);

  const daysRemaining = useMemo(() => {
    if (!goal) return 0;
    const targetDate = new Date(goal.target_date);
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [goal]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!goal) {
        setProbability(null);
        return;
      }
      try {
        const res = await apiJson<{ probability: number }>(
          `/api/goals/${goal.id}/probability?user_id=${encodeURIComponent(userId)}`,
        );
        if (!cancelled) setProbability(res.probability);
      } catch {
        if (!cancelled) setProbability(null);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [goal, userId]);

  if (!goal) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-secondary)]/10"
        >
          <Target className="h-7 w-7 text-[var(--color-accent-primary)]" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm text-[var(--color-text-secondary)]"
        >
          Henüz hedef yok
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button type="button" onClick={onAddGoal} className="gradient">
            Yeni Hedef Ekle
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Hedef Takibi</div>
        <Button type="button" variant="secondary" className="h-8 px-3 text-xs" onClick={onAddGoal}>
          Yeni Hedef
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-accent-primary)]/25 to-[var(--color-accent-secondary)]/15 shadow-lg shadow-[var(--glow-primary)]">
          <GoalAvatar goal={goal} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{goal.title}</div>
          <motion.div
            key={progress}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 text-3xl font-light tracking-tight gradient-text"
          >
            {progress}%
          </motion.div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
            <motion.div
              className="h-2.5 rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ boxShadow: "0 0 10px rgba(99, 102, 241, 0.5)" }}
            />
          </div>
          <div className="mt-4 flex justify-between text-[11px] text-[var(--color-text-secondary)]">
            <div>
              <div>Hedef Tutar</div>
              <div className="text-white font-medium">{goal.target_amount.toLocaleString("tr-TR")}₺</div>
            </div>
            <div className="text-right">
              <div>Biriken Tutar</div>
              <div className="text-white font-medium">{goal.saved_amount.toLocaleString("tr-TR")}₺</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-xs text-[var(--color-text-secondary)]"
      >
        <Calendar className="h-4 w-4 text-[var(--color-accent-primary)]" />
        <span>{daysRemaining} gün kaldı</span>
      </motion.div>

      {probability !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 text-xs text-[var(--color-text-secondary)]"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-accent-primary)]" />
            <span>Hedefe ulaşma ihtimali: </span>
            <span className="font-semibold gradient-text">%{probability}</span>
          </div>
          <span className="text-[10px] mt-1 block">(AI tahmini)</span>
        </motion.div>
      )}
    </div>
  );
}
