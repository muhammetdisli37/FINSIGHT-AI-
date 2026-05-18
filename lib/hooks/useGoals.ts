"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson } from "@/lib/api";
import type { Goal } from "@/types";

export function useGoals(userId: string | null) {
  const [data, setData] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await apiJson<Goal[]>(`/api/goals/?user_id=${encodeURIComponent(userId)}`);
      setData(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hedefler alınamadı");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
