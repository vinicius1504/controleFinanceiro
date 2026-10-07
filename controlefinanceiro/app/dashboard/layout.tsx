"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { logout, type StoredUser } from "@/lib/auth";
import { useLocalStorageRaw } from "@/lib/useLocalStorage";
import { FinanceProvider, useFinance } from "@/components/finance";
import { Corners, Icon, Logo, ToastProvider, useCompact, useTheme } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/contas", label: "Contas", icon: "receipt" },
  { href: "/dashboard/receitas", label: "Receitas", icon: "trending" },
  { href: "/dashboard/categorias", label: "Categorias", icon: "tag" },
  { href: "/dashboard/usuarios", label: "Usuários", icon: "users", adminOnly: true },
];

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter();
  const token = useLocalStorageRaw("token");

  useEffect(() => {
    // Relê direto em vez de confiar em `token`: na montagem o useSyncExternalStore
    // ainda pode estar resolvendo o snapshot do cliente.
    if (localStorage.getItem("token") === null) router.replace("/login");
  }, [token, router]);

  if (token === null) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p className="muted" style={{ fontSize: 14 }}>Carregando…</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <FinanceProvider>
        <Shell>{children}</Shell>
      </FinanceProvider>
    </ToastProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const compact = useCompact();
  const { openLancar } = useFinance();
  const [drawer, setDrawer] = useState(false);
  const userRaw = useLocalStorageRaw("user");
  const user: StoredUser | null = userRaw ? JSON.parse(userRaw) : null;
  const isAdmin = user?.role !== "membro";
  const nav = NAV.filter((n) => !n.adminOnly || isAdmin);
  const current = nav.find((n) => (n.href === "/dashboard" ? pathname === n.href : pathname?.startsWith(n.href)));

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawer(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer]);

  const showAside = !compact || drawer;
  const lancar = () => { setDrawer(false); openLancar(); };

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", position: "relative" }}>
      {compact && drawer && <div onClick={() => setDrawer(false)} style={{ position: "fixed", inset: 0, zIndex: 39, background: "var(--color-scrim)" }} />}

      {showAside && (
        <aside style={{ width: 256, maxWidth: "86%", flex: "none", display: "flex", flexDirection: "column", gap: 22, padding: "22px 16px 16px", borderRight: "1px solid var(--color-divider)", background: "var(--color-bg)", position: compact ? "fixed" : "relative", top: 0, bottom: 0, left: 0, zIndex: 40, boxShadow: compact ? "var(--shadow-lg)" : "none", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px" }}>
            <Logo />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0, flex: 1 }}>
              <span className="font-heading" style={{ fontSize: 19 }}>Controle Financeiro</span>
              <span className="muted" style={{ fontSize: 13 }}>{isAdmin ? "Administrador da família" : "Membro da família"}</span>
            </div>
            {compact && (
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setDrawer(false)} aria-label="Fechar menu" style={{ width: 44, height: 44, color: "var(--color-text)" }}>
                <Icon name="x" size={20} />
              </button>
            )}
          </div>

          <button type="button" className="btn btn-primary blueprint" onClick={lancar} style={{ width: "100%", minHeight: 44, fontSize: 17, gap: 8 }}>
            <Icon name="plus" size={18} />Lançar<Corners />
          </button>

          <nav aria-label="Menu principal" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setDrawer(false)} className="nav-item" aria-current={current?.href === n.href ? "page" : undefined}>
                <Icon name={n.icon} size={19} />
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 14, paddingTop: 16, borderTop: "1px solid var(--color-divider)" }}>
            <ThemeSeg />
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span className="font-heading" style={{ width: 38, height: 38, flex: "none", display: "grid", placeItems: "center", background: "var(--color-accent-100)", color: "var(--color-accent-800)", fontSize: 18 }}>
                {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
              </span>
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.3 }}>
                <span style={{ fontWeight: 500, fontSize: 14 }}>{user?.name || "Usuário"}</span>
                <span className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</span>
              </div>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => logout()} style={{ width: "100%", minHeight: 40, fontSize: 15 }}>
              <Icon name="logout" size={17} />Sair
            </button>
          </div>
        </aside>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {compact && (
          <header style={{ height: 60, flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "0 10px 0 6px", borderBottom: "1px solid var(--color-divider)" }}>
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setDrawer(true)} aria-label="Abrir menu" style={{ width: 44, height: 44, color: "var(--color-text)" }}>
              <Icon name="menu" size={22} />
            </button>
            <span className="font-heading" style={{ flex: 1, minWidth: 0, fontSize: 22, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{current?.label}</span>
            <button type="button" className="btn btn-primary blueprint" onClick={lancar} style={{ minHeight: 44, padding: "0 14px", fontSize: 16 }}>
              <Icon name="plus" size={18} />Lançar<Corners />
            </button>
          </header>
        )}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto", padding: compact ? "16px 16px 48px" : "28px 36px 64px", display: "flex", flexDirection: "column", gap: compact ? 16 : 24 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeSeg() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="seg" role="radiogroup" aria-label="Tema" style={{ width: "100%" }}>
      <label className="seg-opt" style={{ flex: 1, justifyContent: "center", minHeight: 40 }}>
        <input type="radio" name="tema" checked={theme === "light"} onChange={() => setTheme("light")} /><Icon name="sun" size={16} />Claro
      </label>
      <label className="seg-opt" style={{ flex: 1, justifyContent: "center", minHeight: 40 }}>
        <input type="radio" name="tema" checked={theme === "dark"} onChange={() => setTheme("dark")} /><Icon name="moon" size={16} />Escuro
      </label>
    </div>
  );
}
