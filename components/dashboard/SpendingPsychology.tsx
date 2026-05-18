"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Transaction } from "@/types";

type RangeKey = "7d" | "30d" | "month";

function inRange(iso: string, key: RangeKey) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  if (key === "7d") return now - t <= 7 * 86400000;
  if (key === "30d") return now - t <= 30 * 86400000;
  const d = new Date(iso);
  const cur = new Date();
  return d.getMonth() === cur.getMonth() && d.getFullYear() === cur.getFullYear();
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildDayBuckets(range: RangeKey) {
  const now = new Date();
  const count = range === "7d" ? 7 : range === "30d" ? 30 : now.getDate();
  const buckets: { key: string; label: string }[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.toISOString());
    const label = d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
    buckets.push({ key, label });
  }
  return buckets;
}

export function SpendingPsychology({ transactions }: { transactions: Transaction[] }) {
  const [range, setRange] = useState<RangeKey>("7d");

  const data = useMemo(() => {
    const buckets = buildDayBuckets(range);
    const categoryDaily = new Map<string, Record<string, number>>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      if (!inRange(tx.transaction_at, range)) continue;
      const key = dayKey(tx.transaction_at);
      if (!categoryDaily.has(key)) categoryDaily.set(key, { Ulaşım: 0, Market: 0, Eğlence: 0, Diğer: 0 });
      const record = categoryDaily.get(key)!;
      let cat = "Diğer";
      if (tx.category === "Ulaşım") cat = "Ulaşım";
      else if (tx.category === "Market" || tx.category === "Alışveriş" || tx.category === "Yeme & İçme") cat = "Market";
      else if (tx.category === "Eğlence") cat = "Eğlence";
      
      record[cat] = (record[cat] || 0) + tx.amount;
    }

    return buckets.map(({ key, label }) => {
      const record = categoryDaily.get(key) ?? { Ulaşım: 0, Market: 0, Eğlence: 0, Diğer: 0 };
      return { label, ...record };
    });
  }, [transactions, range]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">Harcama Psikolojisi</div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1.5 text-xs text-white transition-colors hover:border-[var(--color-border-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
        >
          <option value="7d">Son 7 Gün</option>
          <option value="30d">Son 30 Gün</option>
          <option value="month">Bu Ay</option>
        </select>
      </div>

      <div className="text-xs text-[var(--color-text-secondary)]">Günlük kümülatif harcama (₺)</div>
      <div className="min-h-[220px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="spendCumulativeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="transportFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="entertainmentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="marketFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-xs text-white shadow-xl backdrop-blur-sm">
                    <div className="mb-2 font-semibold">{p.label}</div>
                    <div className="text-[#06B6D4]">Ulaşım: {p.Ulaşım?.toLocaleString("tr-TR") || 0}₺</div>
                    <div className="text-[#F59E0B]">Market: {p.Market?.toLocaleString("tr-TR") || 0}₺</div>
                    <div className="text-[#F97316]">Eğlence: {p.Eğlence?.toLocaleString("tr-TR") || 0}₺</div>
                    <div className="text-[#8B5CF6]">Diğer: {p.Diğer?.toLocaleString("tr-TR") || 0}₺</div>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="Diğer" stackId="1" stroke="#8B5CF6" fill="url(#spendCumulativeFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="Ulaşım" stackId="1" stroke="#06B6D4" fill="url(#transportFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="Eğlence" stackId="1" stroke="#F97316" fill="url(#entertainmentFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="Market" stackId="1" stroke="#F59E0B" fill="url(#marketFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
