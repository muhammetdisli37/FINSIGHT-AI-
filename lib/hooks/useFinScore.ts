"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api";
import type { FinScoreResponse } from "@/types";

export function useFinScore(userId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const [data, setData] = useState<FinScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const row = await apiJson<FinScoreResponse>(`/api/finscore/?user_id=${encodeURIComponent(userId)}`);
      setData(row);
    } catch (e) {
      setError(e instanceof Error ? e.message : "FinScore alınamadı");
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
      .channel(`fs-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fin_scores", filter: `user_id=eq.${userId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase, userId]);

  return { data, loading, error, reload: load };
}
