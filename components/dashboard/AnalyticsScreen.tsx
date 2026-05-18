"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { apiJson } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function parseMonthKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function isNight(iso: string) {
  const hr = new Date(iso).getHours();
  return hr >= 22 || hr < 6;
}

export function AnalyticsScreen({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const { data: txs } = useTransactions(userId);
  const [hist, setHist] = useState<{ day: string; score: number }[]>([]);
  const [report, setReport] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    supabase
      .from("fin_score_history")
      .select("day,score")
      .eq("user_id", userId)
      .gte("day", since)
      .order("day", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) setHist((data ?? []) as { day: string; score: number }[]);
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, userId]);

  const last6 = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
    }
    const map = new Map<string, { month: string; gelir: number; gider: number }>();
    keys.forEach((k) => map.set(k, { month: k, gelir: 0, gider: 0 }));
    for (const t of txs) {
      const k = monthKey(new Date(t.transaction_at));
      if (!map.has(k)) continue;
      const row = map.get(k)!;
      if (t.type === "income") row.gelir += t.amount;
      else row.gider += t.amount;
    }
    return keys.map((k) => map.get(k)!);
  }, [txs]);

  const categoryTrend = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(monthKey(d));
    }
    const cats = ["Eğlence", "Alışveriş", "Yeme & İçme", "Ulaşım", "Konut"];
    return keys.map((k) => {
      const row: Record<string, number | string> = { month: k };
      for (const c of cats) row[c] = 0;
      const start = parseMonthKey(k);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      for (const t of txs) {
        if (t.type !== "expense") continue;
        if (!cats.includes(t.category)) continue;
        const d = new Date(t.transaction_at);
        if (d >= start && d < end) {
          row[t.category] = (row[t.category] as number) + t.amount;
        }
      }
      return row;
    });
  }, [txs]);

  const top3 = useMemo(() => {
    const since = Date.now() - 30 * 86400000;
    const map = new Map<string, number>();
    for (const t of txs) {
      if (t.type !== "expense") continue;
      if (new Date(t.transaction_at).getTime() < since) continue;
      map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [txs]);

  const nightTotal = useMemo(() => {
    const since = Date.now() - 30 * 86400000;
    let sum = 0;
    for (const t of txs) {
      if (t.type !== "expense") continue;
      if (new Date(t.transaction_at).getTime() < since) continue;
      if (isNight(t.transaction_at)) sum += t.amount;
    }
    return sum;
  }, [txs]);

  const impulseNight = useMemo(() => {
    const since = Date.now() - 30 * 86400000;
    let sum = 0;
    for (const t of txs) {
      if (t.type !== "expense") continue;
      if (new Date(t.transaction_at).getTime() < since) continue;
      if (t.is_impulsive && isNight(t.transaction_at)) sum += t.amount;
    }
    return sum;
  }, [txs]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-3 md:flex-row md:items-end"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">Analitik</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">Trendler, içgörüler ve AI özeti</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            try {
              const res = await apiJson<{ report: string }>("/api/gemini/report", {
                method: "POST",
                body: JSON.stringify({ user_id: userId }),
              });
              setReport(res.report);
              toast.success("Haftalık rapor hazır (bildirim olarak da kaydedildi)");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Rapor alınamadı");
            }
          }}
        >
          Haftalık AI raporu üret
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {top3.map(([name, val], idx) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="p-4">
              <div className="text-xs text-[var(--color-text-secondary)]">En çok harcama #{idx + 1}</div>
              <div className="mt-2 text-lg font-semibold text-white">{name}</div>
              <div className="mt-2 text-2xl font-bold gradient-text">{val.toLocaleString("tr-TR")}₺</div>
              <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
                Son 30 günde toplam payın artışını kontrol et.
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-4">
          <div className="mb-3 text-sm font-semibold text-white">Aylık gelir vs gider (son 6 ay)</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last6}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "rgba(17, 24, 39, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, backdropFilter: "blur(10px)" }}
                />
                <Line type="monotone" dataKey="gelir" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gider" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-4">
          <div className="mb-3 text-sm font-semibold text-white">Kategori bazlı harcama trendleri</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "rgba(17, 24, 39, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, backdropFilter: "blur(10px)" }}
                />
                <Bar dataKey="Eğlence" stackId="a" fill="#EC4899" />
                <Bar dataKey="Alışveriş" stackId="a" fill="#EF4444" />
                <Bar dataKey="Yeme & İçme" stackId="a" fill="#F97316" />
                <Bar dataKey="Ulaşım" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="Konut" stackId="a" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4">
            <div className="mb-3 text-sm font-semibold text-white">Gece harcaması raporu (son 30 gün)</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Gece diliminde toplam: <span className="font-semibold text-white">{nightTotal.toLocaleString("tr-TR")}₺</span>
            </div>
            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Dürtüsel + gece kesişimi:{" "}
              <span className="font-semibold text-white">{impulseNight.toLocaleString("tr-TR")}₺</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4">
            <div className="mb-3 text-sm font-semibold text-white">FinScore geçmişi (son 30 gün)</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hist.map((h) => ({ day: h.day, score: h.score }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: "rgba(17, 24, 39, 0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, backdropFilter: "blur(10px)" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-4">
            <div className="mb-2 text-sm font-semibold gradient-text">Haftalık AI özet raporu</div>
            <pre className="whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">{report}</pre>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
