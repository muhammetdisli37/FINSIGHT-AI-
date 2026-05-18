"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  SquareArrowOutUpRight,
  Target,
  Gauge,
  CircleCheckBig,
  Lightbulb,
  LayoutGrid,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (pathname: string, hash: string) => boolean;
};

const links: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (pathname, hash) => pathname === "/" && hash !== "#finscore",
  },
  {
    href: "/transactions",
    label: "İşlemler",
    icon: SquareArrowOutUpRight,
    match: (pathname) => pathname.startsWith("/transactions"),
  },
  {
    href: "/goals",
    label: "Hedefler",
    icon: Target,
    match: (pathname) => pathname.startsWith("/goals"),
  },
  {
    href: "/#finscore",
    label: "FinScore",
    icon: Gauge,
    match: (pathname, hash) => pathname === "/" && hash === "#finscore",
  },
  {
    href: "/analytics",
    label: "Analizler",
    icon: CircleCheckBig,
    match: (pathname) => pathname === "/analytics",
  },
  {
    href: "/ai-chat",
    label: "AI Tavsiyeler",
    icon: Lightbulb,
    match: (pathname) => pathname.startsWith("/ai-chat"),
  },
  {
    href: "/analytics",
    label: "Raporlar",
    icon: LayoutGrid,
    match: (pathname) => pathname === "/analytics",
  },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function Sidebar({ userId, onNavigate }: { userId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [hash, setHash] = useState("");
  const [displayName, setDisplayName] = useState("Kullanıcı");
  const [email, setEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      const { data } = await supabase.from("profiles").select("full_name,email").eq("id", userId).maybeSingle();
      if (cancelled) return;
      const profileName = data?.full_name?.trim();
      const authEmail = user?.email ?? data?.email ?? "";
      if (profileName) {
        setDisplayName(profileName.split(" ")[0] ?? profileName);
      } else if (authEmail) {
        setDisplayName(authEmail.split("@")[0] ?? "Kullanıcı");
      }
      setEmail(authEmail);
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [supabase, userId, user?.email]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
      onNavigate?.();
    }
  }, [onNavigate, router, supabase.auth]);

  return (
    <aside className="sticky top-0 flex h-screen min-h-screen w-[272px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-6">
      <div className="flex items-center gap-3 px-1">
        <SidebarLogo />
        <div>
          <div className="text-[17px] font-bold tracking-tight gradient-text">FinSight AI</div>
          <div className="text-xs text-[var(--color-text-secondary)]">AI Finans Mentörünüz</div>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-1.5 overflow-y-auto">
        {links.map((l) => {
          const active = l.match(pathname, hash);
          const Icon = l.icon;
          return (
            <Link key={`${l.href}-${l.label}`} href={l.href} onClick={onNavigate} className="block">
              <NavItemRow active={active} icon={Icon} label={l.label} />
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] ring-2 ring-[var(--color-border)] shadow-lg shadow-[var(--glow-primary)]">
            <span className="text-sm font-semibold text-white">{initials(displayName)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{displayName}</div>
            <div className="truncate text-xs text-[var(--color-text-secondary)]">{email || "—"}</div>
          </div>
        </div>
        <button
          type="button"
          disabled={loggingOut}
          onClick={() => void handleLogout()}
          className="mt-3 w-full rounded-lg bg-[var(--color-bg-tertiary)] py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-bg-hover)] hover:text-white disabled:opacity-60"
        >
          {loggingOut ? "Çıkış yapılıyor…" : "Çıkış Yap"}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-secondary)]">
          <Brain className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p className="text-[13px] leading-relaxed text-[var(--color-text-primary)]">
          &ldquo;Finansal özgürlük bir hedef değil, bir alışkanlıktır.&rdquo;
        </p>
        <p className="mt-2 text-xs font-medium text-[var(--color-text-secondary)]">— FinSight AI</p>
      </div>
    </aside>
  );
}

function SidebarLogo() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-secondary)]/20 text-[var(--color-accent-secondary)] shadow-lg shadow-[var(--glow-primary)]">
      <Brain className="h-6 w-6" strokeWidth={1.75} />
    </div>
  );
}

function NavItemRow({
  active,
  icon: Icon,
  label,
}: {
  active: boolean;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition-all duration-200",
        active
          ? "bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white shadow-lg shadow-[var(--glow-primary)] border border-[var(--color-accent-primary)]/30"
          : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-white hover:border hover:border-[var(--color-border-hover)]",
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-[var(--color-accent-primary)]")} />
      <span>{label}</span>
    </div>
  );
}
