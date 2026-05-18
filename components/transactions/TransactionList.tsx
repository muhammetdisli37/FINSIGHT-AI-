"use client";

import { useMemo, useState } from "react";
import type { Transaction } from "@/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const categories = useMemo(() => {
    const s = new Set<string>();
    transactions.forEach((t) => s.add(t.category));
    return Array.from(s).sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (category && t.category !== category) return false;
      if (from && new Date(t.transaction_at) < new Date(from)) return false;
      if (to && new Date(t.transaction_at) > new Date(to)) return false;
      if (q) {
        const hay = `${t.note ?? ""} ${t.category}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [transactions, q, category, from, to]);

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-10 text-center text-sm text-[var(--color-text-secondary)]"
      >
        Henüz işlem yok. Sağ alttaki + ile ekleyebilirsiniz.
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara (not/kategori)" />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 text-sm text-white transition-colors hover:border-[var(--color-border-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
        >
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-tertiary)] text-xs text-[var(--color-text-secondary)]">
            <tr>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Tür</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Not</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="border-t border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg-hover)]"
              >
                <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                  {new Date(t.transaction_at).toLocaleString("tr-TR")}
                </td>
                <td className="px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    {t.category}
                    {t.is_impulsive && (
                      <Badge className="bg-[var(--color-accent-red)]/15 text-[10px] text-[var(--color-accent-red)]">
                        Dürtüsel
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">{t.type === "income" ? "Gelir" : "Gider"}</td>
                <td className="px-4 py-3 text-sm font-semibold text-white">
                  {t.amount.toLocaleString("tr-TR")}₺
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{t.note ?? "—"}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
