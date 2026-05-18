"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { useFinScore } from "@/lib/hooks/useFinScore";
import { TransactionList } from "@/components/transactions/TransactionList";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";

export function TransactionsScreen({ userId }: { userId: string }) {
  const { data, loading, reload } = useTransactions(userId);
  const { reload: reloadFin } = useFinScore(userId);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-semibold text-white">İşlemler</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Arama, filtre ve hızlı ekleme</p>
      </motion.div>

      {loading ? (
        <div className="text-sm text-[var(--color-text-secondary)]">Yükleniyor…</div>
      ) : (
        <TransactionList transactions={data} />
      )}

      <AddTransactionModal
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        onCreated={async () => {
          await reload();
          await reloadFin();
          toast.success("İşlem eklendi");
        }}
      />

      <motion.button
        type="button"
        aria-label="İşlem ekle"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white shadow-lg shadow-[var(--glow-primary)]"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </div>
  );
}
