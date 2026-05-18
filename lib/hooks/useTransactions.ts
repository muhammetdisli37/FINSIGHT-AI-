"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api";
import type { Transaction } from "@/types";

export function useTransactions(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await apiJson<Transaction[]>(`/api/transactions/?user_id=${encodeURIComponent(userId)}`);
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlemler alınamadı");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`tx-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${userId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase, userId]);

  return { data, loading, error, reload: load };
}
