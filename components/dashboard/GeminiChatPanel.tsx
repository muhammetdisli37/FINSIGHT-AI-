"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const chips = ["Bu ay ne kadar harcadım?", "Tatil yapabilir miyim?", "Nerede tasarruf edebilirim?", "FinScoreumu nasıl artırabilirim?"];

export function GeminiChatPanel({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [typingText, setTypingText] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id,role,content,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessages((data ?? []) as ChatMessage[]);
  }, [supabase, userId]);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel(`chat-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${userId}` },
        () => void load(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase, userId]);

  // Typing animation effect
  useEffect(() => {
    if (thinking) {
      const phrases = ["AI düşünüyor", "Analiz ediliyor", "Öneriler hazırlanıyor"];
      let index = 0;
      const interval = setInterval(() => {
        setTypingText(phrases[index % phrases.length]);
        index++;
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setTypingText("");
    }
  }, [thinking]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setThinking(true);
    try {
      const res = await apiJson<{ reply: string }>("/api/gemini/chat", {
        method: "POST",
        body: JSON.stringify({ user_id: userId, message: trimmed }),
      });
      setInput("");
      await load();
      void res;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gönderilemedi");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex h-full min-h-[520px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--color-accent-primary)]" />
          <div className="text-sm font-semibold text-white">AI Finans Asistanı</div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
        <div className="space-y-3 pr-2">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)]">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">Sohbeti başlatmak için bir mesaj yazın.</div>
            </motion.div>
          )}
          <AnimatePresence mode="popLayout">
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] break-words rounded-2xl rounded-tr-sm bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] px-4 py-3 text-sm text-white shadow-lg"
                      : "max-w-[90%] break-words overflow-hidden rounded-2xl rounded-tl-sm border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-sm text-[var(--color-text-secondary)] shadow-md"
                  }
                >
                  <p className="max-h-[250px] overflow-y-auto whitespace-pre-line break-words leading-relaxed">{m.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {thinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-accent-primary)]" />
                <span className="animate-pulse">{typingText}</span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((c, i) => (
          <motion.button
            key={c}
            type="button"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => void send(c)}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] transition-all duration-200 hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-bg-hover)] hover:text-white"
          >
            {c}
          </motion.button>
        ))}
      </div>

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Bir şeyler sorun..." 
          disabled={thinking}
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={thinking || !input.trim()}
          className="gradient"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
