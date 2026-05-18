"use client";

import { useMemo, useState } from "react";
import {
  Bus,
  Car,
  Coffee,
  Gift,
  Home,
  ShoppingBag,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Transaction } from "@/types";

type RangeKey = "month" | "last" | "3m";

const COLORS = ["#6366F1", "#8B5CF6", "#A855F7", "#3B82F6", "#10B981", "#F97316", "#EC4899", "#F59E0B"];

function monthDiff(a: Date, b: Date) {
  return (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
}

function categoryIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("ulaşım") || n.includes("ulasim") || n.includes("transport")) return Bus;
  if (n.includes("yakıt") || n.includes("yakit") || n.includes("araba")) return Car;
  if (n.includes("yemek") || n.includes("restoran") || n.includes("food")) return Utensils;
  if (n.includes("market") || n.includes("alışveriş") || n.includes("alisveris")) return ShoppingBag;
  if (n.includes("kafe") || n.includes("cafe")) return Coffee;
  if (n.includes("ev") || n.includes("kira") || n.includes("fatura")) return Home;
  if (n.includes("hediye") || n.includes("gift")) return Gift;
  if (n.includes("diğer") || n.includes("diger") || n.includes("other")) return Wallet;
  return Wallet;
}

export function MonthlySummaryChart({ transactions }: { transactions: Transaction[] }) {
  const [range, setRange] = useState<RangeKey>("month");

  const { rows, total } = useMemo(() => {
    const now = new Date();
    const map = new Map<string, number>();
    let sum = 0;
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.transaction_at);
      const ok =
        range === "month"
          ? d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          : range === "last"
            ? monthDiff(now, d) === 1
            : monthDiff(now, d) >= 0 && monthDiff(now, d) < 3;
      if (!ok) continue;
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
      sum += tx.amount;
    }
    const list = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    return { rows: list, total: sum };
  }, [transactions, range]);

  const chartData = rows.map((r) => ({ ...r, pct: total > 0 ? Math.round((r.value / total) * 100) : 0 }));

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">Aylık Özet</div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2.5 py-1.5 text-xs text-white transition-colors hover:border-[var(--color-border-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
        >
          <option value="month">Bu Ay</option>
          <option value="last">Geçen Ay</option>
          <option value="3m">Son 3 Ay</option>
        </select>
      </div>

      {total === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm text-[var(--color-text-secondary)]">
          Bu dönem için gider yok
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 items-center gap-6 md:grid-cols-2">
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={78}
                  paddingAngle={3}
                  stroke="transparent"
                  strokeWidth={0}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(17, 24, 39, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    backdropFilter: "blur(10px)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">Toplam</div>
              <div className="text-lg font-light gradient-text">{total.toLocaleString("tr-TR")}₺</div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {chartData.map((c, i) => {
              const Icon = categoryIcon(c.name);
              return (
                <div key={c.name} className="flex items-center justify-between text-xs transition-colors hover:bg-[var(--color-bg-hover)] rounded-lg px-2 py-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
                      style={{ color: COLORS[i % COLORS.length] }}
                    >
                      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </span>
                    <span className="text-[var(--color-text-primary)]">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                    <span>%{c.pct}</span>
                    <span className="w-16 text-right font-medium text-white">
                      {c.value.toLocaleString("tr-TR")}₺
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
