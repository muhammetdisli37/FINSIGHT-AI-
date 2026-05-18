"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function DashboardShell({ userId, children }: { userId: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-primary)]">
      <div className="hidden shrink-0 md:block">
        <Sidebar userId={userId} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: -288, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -288, opacity: 0 }}
            className="fixed inset-y-0 left-0 z-40 md:hidden"
          >
            <Sidebar userId={userId} onNavigate={() => setOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {open && (
        <button
          type="button"
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 md:hidden">
          <Button type="button" variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold gradient-text">FinSight AI</span>
        </div>
        <TopBar userId={userId} />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] p-7 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
