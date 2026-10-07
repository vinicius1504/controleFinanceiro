"use client";

import { Corners, Icon, Logo, ThemeToggleButton, useCompact } from "./ui";

/** Layout das telas de login/cadastro: painel azul à esquerda (desktop) e formulário à direita. */
export function AuthShell({ error, info, children }: { error?: string; info?: React.ReactNode; children: React.ReactNode }) {
  const compact = useCompact();
  const onField = "var(--color-on-field)";
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {!compact && (
        <aside style={{ flex: "0 0 44%", maxWidth: 640, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 32, padding: "40px 48px", background: "var(--color-field)", color: onField, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Logo size={36} onField />
            <span className="font-heading" style={{ fontSize: 22 }}>Controle Financeiro</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
            <h1 style={{ fontSize: 60, lineHeight: 1, margin: 0, maxWidth: "11ch", color: onField }}>As contas da família, num lugar só.</h1>
            {/* Ilustração com valores de exemplo, não são dados reais. */}
            <div className="blueprint" aria-hidden="true" style={{ maxWidth: 420, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 14, borderColor: "color-mix(in srgb, var(--color-on-field) 35%, transparent)" }}>
              <Corners color={onField} />
              <span style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Saldo do mês</span>
              <span className="font-heading tabular" style={{ fontSize: 46, lineHeight: 1 }}>R$ 2.847,30</span>
              <div className="tabular" style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr) auto", gap: "10px 12px", alignItems: "center", fontSize: 14 }}>
                <span>Receitas</span><div style={{ height: 10, background: onField }} /><span>R$ 9.480,00</span>
                <span>Despesas</span>
                <div><div style={{ height: 10, width: "70%", background: `repeating-linear-gradient(135deg, ${onField} 0 2px, transparent 2px 5px)`, boxShadow: `inset 0 0 0 1px ${onField}` }} /></div>
                <span>R$ 6.632,70</span>
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 15, maxWidth: "42ch", color: "color-mix(in srgb, var(--color-on-field) 82%, var(--color-field))" }}>
            Quem administra cadastra a família. Todos veem e lançam receitas e despesas nos mesmos dados.
          </p>
        </aside>
      )}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: compact ? "12px 16px 24px" : "20px 40px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {compact && (
            <>
              <Logo />
              <span className="font-heading" style={{ fontSize: 20 }}>Controle Financeiro</span>
            </>
          )}
          <span style={{ flex: 1 }} />
          <ThemeToggleButton />
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
          <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 22 }}>
            {info && !error && (
              <div role="status" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", border: "1px solid var(--color-pos)", background: "var(--color-pos-bg)", fontSize: 14 }}>
                <span style={{ color: "var(--color-pos)" }}><Icon name="inbox" size={18} /></span><span>{info}</span>
              </div>
            )}
            {error && (
              <div role="alert" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", border: "1px solid var(--color-neg)", background: "var(--color-neg-bg)", fontSize: 14 }}>
                <span style={{ color: "var(--color-neg)" }}><Icon name="alert" size={18} /></span><span>{error}</span>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
