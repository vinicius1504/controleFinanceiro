"use client";

import { useState } from "react";
import { MESES } from "@/lib/meses";
import { br, MESES_CURTOS, pad } from "@/lib/format";
import { useFinance, type Categoria, type Item } from "./finance";
import { Corners, Icon, useCompact } from "./ui";

/* ─── Cabeçalho da página: título, seletor de mês e ação principal ─── */
export function PageHeader({ title, sub, showMonth, action }: { title: string; sub: string; showMonth?: boolean; action?: { label: string; onClick: () => void } }) {
  const compact = useCompact();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      {!compact && (
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 42 }}>{title}</h1>
          <p className="muted" style={{ margin: 0, fontSize: 15 }}>{sub}</p>
        </div>
      )}
      {compact && !showMonth && <p className="muted" style={{ margin: 0, fontSize: 15 }}>{sub}</p>}
      {(showMonth || action) && (
        <div style={{ display: "flex", alignItems: "stretch", gap: 10, flexWrap: "wrap", width: compact ? "100%" : "auto" }}>
          {showMonth && <MonthPicker />}
          {action && (
            <button type="button" className="btn btn-secondary" onClick={action.onClick} style={{ minHeight: "var(--ctl-h)", padding: "0 16px", fontSize: 16, whiteSpace: "nowrap", flex: compact ? "1 1 100%" : "0 0 auto" }}>
              <Icon name="plus" size={18} />{action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MonthPicker() {
  const { y, m, setMonth, today } = useFinance();
  const compact = useCompact();
  const [open, setOpen] = useState(false);
  const [pickerY, setPickerY] = useState(y);
  const shift = (d: number) => {
    let ny = y, nm = m + d;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    setMonth(ny, nm);
  };
  const pick = (ny: number, nm: number) => { setMonth(ny, nm); setOpen(false); };
  const curKey = today.slice(0, 7);
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "stretch", border: "1px solid var(--color-divider)", flex: compact ? "1 1 100%" : "0 0 auto" }}>
      <button type="button" className="btn btn-ghost btn-icon" onClick={() => shift(-1)} aria-label="Mês anterior" title="Mês anterior" style={{ width: 44, height: "var(--ctl-h)", color: "var(--color-text)" }}>
        <Icon name="chevronLeft" size={20} />
      </button>
      <button
        type="button" className="font-heading" onClick={() => { setPickerY(y); setOpen(!open); }} aria-haspopup="dialog" aria-expanded={open}
        style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0 12px", border: 0, borderLeft: "1px solid var(--color-divider)", borderRight: "1px solid var(--color-divider)", background: "transparent", color: "var(--color-text)", fontSize: 19, cursor: "pointer" }}
      >
        {MESES[m]} {y}<Icon name="chevronDown" size={16} />
      </button>
      <button type="button" className="btn btn-ghost btn-icon" onClick={() => shift(1)} aria-label="Próximo mês" title="Próximo mês" style={{ width: 44, height: "var(--ctl-h)", color: "var(--color-text)" }}>
        <Icon name="chevronRight" size={20} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 29 }} />
          <div className="blueprint" role="dialog" aria-label="Escolher mês" style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 30, width: 300, maxWidth: "calc(100vw - 32px)", background: "var(--color-bg)", boxShadow: "var(--shadow-lg)", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <Corners />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPickerY(pickerY - 1)} aria-label="Ano anterior" style={{ width: 40, height: 40, color: "var(--color-text)" }}><Icon name="chevronLeft" size={18} /></button>
              <span className="font-heading" style={{ fontSize: 22 }}>{pickerY}</span>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPickerY(pickerY + 1)} aria-label="Próximo ano" style={{ width: 40, height: 40, color: "var(--color-text)" }}><Icon name="chevronRight" size={18} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 6 }}>
              {MESES_CURTOS.map((l, k) => {
                const sel = pickerY === y && k === m;
                const cur = `${pickerY}-${pad(k + 1)}` === curKey;
                return (
                  <button key={l} type="button" className="btn" onClick={() => pick(pickerY, k)} aria-pressed={sel}
                    style={{ minHeight: 42, fontSize: 16, background: sel ? "var(--color-accent)" : "transparent", color: sel ? "var(--color-bg)" : "var(--color-text)", borderColor: sel || cur ? "var(--color-accent)" : "var(--color-divider)" }}>
                    {l}
                  </button>
                );
              })}
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => pick(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1)} style={{ alignSelf: "center", fontSize: 15, minHeight: 40, color: "var(--color-accent-700)" }}>
              Ir para o mês atual
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Estados de carregamento e erro ─── */
export function LoadingSkeleton() {
  const bar = (w: string, h: number) => <div className="skel" style={{ width: w, height: h }} />;
  return (
    <div aria-busy="true" aria-label="Carregando" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 20 }}>
        {["72%", "64%", "70%", "58%"].map((w, i) => (
          <div key={i} style={{ height: 118, border: "1px solid var(--color-divider)", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            {bar("40%", 10)}{bar(w, 30)}{bar("50%", 10)}
          </div>
        ))}
      </div>
      <div style={{ border: "1px solid var(--color-divider)", padding: "8px 20px" }}>
        {[["42%", "24%", 96], ["36%", "28%", 84], ["48%", "22%", 102], ["30%", "26%", 78]].map(([a, b, c], i) => (
          <div key={i} className={i ? "row-line" : undefined} style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 0" }}>
            <div className="skel" style={{ width: 32, height: 32 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>{bar(a as string, 12)}{bar(b as string, 10)}</div>
            <div className="skel" style={{ width: c as number, height: 18 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorBanner({ title, detail, onRetry }: { title: string; detail?: string; onRetry: () => void }) {
  return (
    <div role="alert" className="blueprint" style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap", padding: "18px 20px", borderColor: "var(--color-neg)", background: "var(--color-neg-bg)" }}>
      <Corners />
      <span style={{ color: "var(--color-neg)" }}><Icon name="alert" size={24} /></span>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div className="font-heading" style={{ fontSize: 22, lineHeight: 1.15 }}>{title}</div>
        <p style={{ margin: "4px 0 0", fontSize: 15 }}>{detail || "Verifique sua conexão com a internet e tente de novo. Nenhum lançamento foi perdido."}</p>
      </div>
      <button type="button" className="btn btn-secondary" onClick={onRetry} style={{ minHeight: "var(--ctl-h)", padding: "0 16px", fontSize: 15, background: "var(--color-bg)" }}>
        <Icon name="refresh" size={16} />Tentar de novo
      </button>
    </div>
  );
}

/* ─── Apresentação de um lançamento (status, cores, rótulos) ─── */
export type RowView = {
  status: string; sBg: string; sFg: string; sBd: string;
  catName: string; catColor: string; catBg: string;
  dateLabel: string; dateColor: string; late: boolean;
  valueColor: string; toggleTitle: string;
};

export function rowView(i: Item, cat: Categoria | undefined, today: string): RowView {
  const isC = i.tipo === "despesa";
  const late = isC && !i.is_paid && i.due < today;
  let status: string, sBg: string, sFg: string, sBd = "transparent";
  if (i.is_paid) {
    status = isC ? "Pago" : "Recebido";
    sBg = isC ? "var(--color-accent-100)" : "var(--color-pos-bg)";
    sFg = isC ? "var(--color-accent-800)" : "var(--color-pos)";
  } else if (late) {
    status = "Vencida"; sBg = "var(--color-neg-bg)"; sFg = "var(--color-neg)";
  } else {
    status = isC ? "Em aberto" : "A receber"; sBg = "transparent"; sFg = "var(--color-neutral-800)"; sBd = "var(--color-divider)";
  }
  let dateLabel: string;
  if (i.is_paid) dateLabel = (isC ? "Pago em " : "Recebido em ") + br(i.data_pagamento || i.due);
  else if (i.due === today) dateLabel = isC ? "Vence hoje" : "Previsto para hoje";
  else if (late) dateLabel = "Venceu em " + br(i.due);
  else dateLabel = (isC ? "Vence em " : "Previsto para ") + br(i.due);
  const cc = cat?.cor || "var(--color-neutral-500)";
  return {
    status, sBg, sFg, sBd,
    catName: cat?.nome ?? "Sem categoria", catColor: cc, catBg: `color-mix(in srgb, ${cc} 16%, transparent)`,
    dateLabel, dateColor: late ? "var(--color-neg)" : "var(--color-neutral-700)", late,
    valueColor: isC ? "var(--color-neg)" : "var(--color-pos)",
    toggleTitle: isC ? (i.is_paid ? "Desmarcar pagamento" : "Marcar como pago") : (i.is_paid ? "Desmarcar recebimento" : "Marcar como recebido"),
  };
}

export function CatTag({ v, compact }: { v: RowView; compact?: boolean }) {
  return (
    <span className="tag" style={{ padding: compact ? "2px 8px" : undefined, background: v.catBg, color: "var(--color-text)" }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", flex: "none", background: v.catColor }} />{v.catName}
    </span>
  );
}

export function StatusTag({ v, compact }: { v: RowView; compact?: boolean }) {
  return (
    <span className="tag" style={{ padding: compact ? "2px 8px" : undefined, background: v.sBg, color: v.sFg, boxShadow: `inset 0 0 0 1px ${v.sBd}` }}>{v.status}</span>
  );
}

export function PaidToggle({ item, v, size }: { item: Item; v: RowView; size: number }) {
  const { togglePaid } = useFinance();
  return (
    <button type="button" className="paid-toggle" onClick={() => togglePaid(item)} title={v.toggleTitle} aria-label={v.toggleTitle} aria-pressed={item.is_paid} data-late={v.late} style={{ width: size, height: size }}>
      {item.is_paid && <Icon name="check" size={16} strokeWidth={2} />}
    </button>
  );
}
