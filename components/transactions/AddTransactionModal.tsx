"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categories = ["Konut", "Yeme & İçme", "Ulaşım", "Eğlence", "Alışveriş", "Sağlık", "Diğer", "Maaş"];

export function AddTransactionModal({
  open,
  onOpenChange,
  userId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  onCreated: () => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const defaultWhen = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İşlem ekle</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            const fd = new FormData(e.currentTarget);
            try {
              const type = String(fd.get("type"));
              const iso = new Date(String(fd.get("when"))).toISOString();
              await apiJson("/api/transactions/", {
                method: "POST",
                body: JSON.stringify({
                  user_id: userId,
                  category: String(fd.get("category")),
                  amount: Number(fd.get("amount")),
                  type,
                  note: String(fd.get("note") || ""),
                  transaction_at: iso,
                  is_recurring: fd.get("recurring") === "on",
                }),
              });
              await onCreated();
              onOpenChange(false);
              (e.target as HTMLFormElement).reset();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Kayıt başarısız");
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <Label>Tutar (₺)</Label>
              <Input name="amount" type="number" step="0.01" required />
            </div>
            <div>
              <Label>Tür</Label>
              <select
                name="type"
                className="h-10 w-full rounded-[8px] border border-[var(--color-border)] bg-[#0d0d14] px-3 text-sm text-white"
                defaultValue="expense"
              >
                <option value="expense">Gider</option>
                <option value="income">Gelir</option>
              </select>
            </div>
          </div>

          <div>
            <Label>Kategori</Label>
            <select
              name="category"
              className="h-10 w-full rounded-[8px] border border-[var(--color-border)] bg-[#0d0d14] px-3 text-sm text-white"
              required
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Tarih-saat</Label>
            <Input name="when" type="datetime-local" required defaultValue={defaultWhen} />
          </div>

          <div>
            <Label>Not</Label>
            <Input name="note" />
          </div>

          <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <input name="recurring" type="checkbox" className="h-4 w-4" />
            Tekrarlayan işlem
          </label>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Kaydediliyor…" : "Kaydet"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
