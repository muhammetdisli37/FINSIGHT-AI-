"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api";
import type { NotificationRow } from "@/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export function TopBar({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<NotificationRow[]>([]);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<NotificationRow[]>(
        `/api/notifications/?user_id=${encodeURIComponent(userId)}`,
      );
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("TopBar load notifications error:", error);
      setItems([]);
    }
  }, [userId]);

  useEffect(() => {
    void load();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => void load(),
        )
        .subscribe();
    } catch (e) {
      console.error("TopBar realtime subscribe error:", e);
    }
    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [load, supabase, userId]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      await apiJson(`/api/notifications/mark-read?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
        body: JSON.stringify({ notification_ids: ids }),
      });
      await load();
    } catch (error) {
      console.error("TopBar markRead error:", error);
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-4">
      <div className="text-sm text-[var(--color-text-secondary)]">Hoş geldiniz</div>
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative transition-colors hover:bg-[var(--color-bg-hover)]">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] px-1 text-[10px] font-bold leading-[18px] text-white shadow-lg shadow-[var(--glow-primary)]">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-96 overflow-auto border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            {items.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[var(--color-text-secondary)]">
                Bildirim yok
              </div>
            ) : (
              items.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-1 whitespace-normal transition-colors hover:bg-[var(--color-bg-hover)]"
                  onClick={() => void markRead([n.id])}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">{n.title}</span>
                    {!n.read && <Badge className="bg-[var(--color-accent-primary)]/20 text-[10px]">Yeni</Badge>}
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)]">{n.body}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
