"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, AlertTriangle, Target, TrendingUp, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api";
import type { NotificationRow } from "@/types";
import { motion } from "framer-motion";

export function SmartNotifications({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<NotificationRow[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<NotificationRow[]>(
        `/api/notifications/?user_id=${encodeURIComponent(userId)}`,
      );
      const list = Array.isArray(data) ? data : [];
      setItems(list.slice(0, 4));
    } catch (error) {
      console.error("SmartNotifications load error:", error);
      setItems([]);
    }
  }, [userId]);

  useEffect(() => {
    void load();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`smart-notif-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => void load(),
        )
        .subscribe();
    } catch (e) {
      console.error("SmartNotifications realtime subscribe error:", e);
    }
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load, supabase, userId]);

  const getIcon = (type: string) => {
    switch (type) {
      case "night_spending":
        return <AlertTriangle className="h-4 w-4 text-[var(--color-accent-orange)]" />;
      case "budget_warning":
        return <Bell className="h-4 w-4 text-[var(--color-accent-yellow)]" />;
      case "goal_near":
        return <Target className="h-4 w-4 text-[var(--color-accent-primary)]" />;
      case "weekly_summary":
        return <TrendingUp className="h-4 w-4 text-[var(--color-accent-green)]" />;
      default:
        return <Sparkles className="h-4 w-4 text-[var(--color-accent-secondary)]" />;
    }
  };

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-sm text-[var(--color-text-secondary)]"
      >
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-4 w-4 text-[var(--color-accent-primary)]" />
          <span className="font-semibold text-white">Akıllı Bildirimler</span>
        </div>
        <p>Gece harcaması, bütçe uyarıları, hedef yaklaşma ve haftalık özetler burada listelenir.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((n, i) => (
        <motion.div
          key={n.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs transition-colors hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-hover)]"
        >
          <div className="flex items-start gap-2">
            <div className="mt-0.5">{getIcon(n.type)}</div>
            <div className="flex-1">
              <div className="font-semibold text-white">{n.title}</div>
              <div className="mt-1 text-[var(--color-text-secondary)]">{n.body}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
