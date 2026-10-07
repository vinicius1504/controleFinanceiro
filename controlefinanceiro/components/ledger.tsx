"use client";

import { useEffect } from "react";
import { MESES } from "@/lib/meses";
import { br, fmt, pad, plural, recurLabel } from "@/lib/format";
import { useFinance, type Item, type LedgerFilter } from "./finance";
import { CatTag, ErrorBanner, LoadingSkeleton, PageHeader, PaidToggle, rowView, StatusTag } from "./page";
import { Corners, Icon, useCompact, useWide } from "./ui";

const sum = (a: Item[]) => a.reduce((t, i) => t + i.valor, 0);

/** Tela de Contas (despesas) ou Receitas — mesma estrutura, textos e cores diferentes. */
export function Ledger({ tipo }: { tipo: "despesa" | "receita" }) {
  const { items, loading, error, reload, y, m, today, catById, openForm, askDelete, ledgerFilter, setLedgerFilter } = useFinance();
  const compact = useCompact();
  const wide = useWide();
  const isC = tipo === "despesa";
  const lt = isC ? "conta" : "receita";
  const monthSlash = `${MESES[m]}/${y}`;

  // O filtro vem do dashboard (ex.: card "Vencidas"); ao sair da tela, volta para "Todas".
  useEffect(() => () => setLedgerFilter("todas"), [setLedgerFilter]);

  const header = (
    <PageHeader
      title={isC ? "Contas" : "Receitas"}
      sub={isC ? "Despesas e contas a pagar da família" : "Salários, diárias e serviços que entram no mês"}
      showMonth
      action={{ label: isC ? "Nova conta" : "Nova receita", onClick: () => openForm(tipo) }}
    />
  );
  if (error) return <>{header}<ErrorBanner title={`Não foi possível carregar os dados de ${monthSlash}`} onRetry={reload} /></>;
  if (loading) return <>{header}<LoadingSkeleton /></>;

  const prefix = `${y}-${pad(m + 1)}`;
  const lItems = items
    .filter((i) => i.tipo === tipo && i.due.startsWith(prefix))
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.desc.localeCompare(b.desc)));
  const pagas = lItems.filter((i) => i.is_paid), abertas = lItems.filter((i) => !i.is_paid);
  const vencidas = abertas.filter((i) => i.due < today);

  const fdefs: [LedgerFilter, string, (i: Item) => boolean, string][] = isC
    ? [["todas", "Todas", () => true, ""], ["aberto", "Em aberto", (i) => !i.is_paid, "em aberto"], ["pagas", "Pagas", (i) => i.is_paid, "paga"], ["vencidas", "Vencidas", (i) => !i.is_paid && i.due < today, "vencida"]]
    : [["todas", "Todas", () => true, ""], ["aberto", "A receber", (i) => !i.is_paid, "a receber"], ["pagas", "Recebidas", (i) => i.is_paid, "recebida"]];
  const cur = fdefs.find((f) => f[0] === ledgerFilter) || fdefs[0];
  const rows = lItems.filter(cur[2]);

  const cells = isC
    ? [
        { label: "Total do mês", value: fmt(sum(lItems)), color: "var(--color-neg)", sub: plural(lItems.length, "conta", "contas") },
        { label: "Pago", value: fmt(sum(pagas)), color: "var(--color-text)", sub: plural(pagas.length, "conta", "contas") },
        { label: "Em aberto", value: fmt(sum(abertas)), color: "var(--color-text)", sub: plural(abertas.length, "conta", "contas") },
        { label: "Vencidas", value: fmt(sum(vencidas)), color: vencidas.length ? "var(--color-neg)" : "var(--color-text)", sub: plural(vencidas.length, "conta", "contas") },
      ]
    : [
        { label: "Total do mês", value: fmt(sum(lItems)), color: "var(--color-pos)", sub: plural(lItems.length, "receita", "receitas") },
        { label: "Recebido", value: fmt(sum(pagas)), color: "var(--color-text)", sub: plural(pagas.length, "receita", "receitas") },
        { label: "A receber", value: fmt(sum(abertas)), color: "var(--color-text)", sub: plural(abertas.length, "receita", "receitas") },
      ];
  const showTable = wide && !compact;
  const twoCol = compact || (!showTable && cells.length === 4);
  const footCount = plural(rows.length, lt, lt + "s");
  const footTotal = fmt(sum(rows));

  return (
    <>
      {header}

      <div className="blueprint" style={{ display: "grid", gridTemplateColumns: twoCol ? "repeat(2, minmax(0,1fr))" : `repeat(${cells.length}, minmax(0,1fr))`, gap: 1, background: "var(--color-divider)" }}>
        <Corners />
        {cells.map((c, i) => (
          <div key={c.label} style={{ gridColumn: twoCol && cells.length === 3 && i === 0 ? "1 / -1" : "auto", background: "var(--color-bg)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
            <span className="card-kicker">{c.label}</span>
            <span className="font-heading tabular" style={{ fontSize: compact ? 24 : 32, lineHeight: 1.05, color: c.color }}>{c.value}</span>
            <span className="muted" style={{ fontSize: 13 }}>{c.sub}</span>
          </div>
        ))}
      </div>

      {lItems.length > 0 && (
        <div style={{ overflowX: "auto", padding: 2 }}>
          <div className="seg" role="radiogroup" aria-label="Filtrar por status">
            {fdefs.map((f) => (
              <label key={f[0]} className="seg-opt" style={{ whiteSpace: "nowrap", padding: "0 14px", fontSize: 14 }}>
                <input type="radio" name="filtro" checked={f === cur} onChange={() => setLedgerFilter(f[0])} />{f[1]} ({lItems.filter(f[2]).length})
              </label>
            ))}
          </div>
        </div>
      )}

      {rows.length > 0 && showTable && (
        <div className="blueprint" style={{ padding: "4px 16px 8px", overflowX: "auto" }}>
          <Corners />
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 48 }} /><th>Descrição</th><th>Categoria</th><th>{isC ? "Vencimento" : "Data"}</th><th>Recorrência</th><th>Status</th><th style={{ textAlign: "right" }}>Valor</th><th style={{ width: 96 }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const v = rowView(i, catById(i.categoria_id), today);
                return (
                  <tr key={i.id}>
                    <td><PaidToggle item={i} v={v} size={32} /></td>
                    <td>
                      <div style={{ fontSize: 15, fontWeight: 500 }}>{i.desc}</div>
                      {i.parcel && <div className="muted" style={{ fontSize: 12 }}>Parcela {i.parcel.n}/{i.parcel.total}</div>}
                    </td>
                    <td><CatTag v={v} /></td>
                    <td className="tabular" style={{ color: v.dateColor }}>{br(i.due)}</td>
                    <td className="muted">{recurLabel(i.recorrencia)}</td>
                    <td><StatusTag v={v} /></td>
                    <td className="font-heading tabular" style={{ textAlign: "right", fontSize: 18, whiteSpace: "nowrap", color: v.valueColor }}>{fmt(i.valor)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={() => openForm(tipo, i)} aria-label="Editar" title="Editar" style={{ color: "var(--color-text)" }}><Icon name="pencil" size={17} /></button>
                        <button type="button" className="btn btn-ghost btn-icon" onClick={() => askDelete(i)} aria-label="Excluir" title="Excluir" style={{ color: "var(--color-text)" }}><Icon name="trash" size={17} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="muted" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 8px 6px", fontSize: 14 }}>
            <span>{footCount}</span>
            <span>Total <strong className="font-heading tabular" style={{ fontSize: 19, color: "var(--color-text)" }}>{footTotal}</strong></span>
          </div>
        </div>
      )}

      {rows.length > 0 && !showTable && (
        <div className="blueprint" style={{ padding: "2px 14px" }}>
          <Corners />
          {rows.map((i, idx) => {
            const v = rowView(i, catById(i.categoria_id), today);
            return (
              <div key={i.id} className={idx ? "row-line" : undefined} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0" }}>
                <PaidToggle item={i} v={v} size={44} />
                <button type="button" onClick={() => openForm(tipo, i)} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7, padding: 0, border: 0, background: "none", color: "inherit", textAlign: "left", cursor: "pointer" }}>
                  <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, width: "100%" }}>
                    <span style={{ fontSize: 16, fontWeight: 500, minWidth: 0 }}>
                      {i.desc}{i.parcel && <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}> · {i.parcel.n}/{i.parcel.total}</span>}
                    </span>
                    <span className="font-heading tabular" style={{ fontSize: 20, whiteSpace: "nowrap", color: v.valueColor }}>{fmt(i.valor)}</span>
                  </span>
                  <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 8px", fontSize: 13 }}>
                    <CatTag v={v} compact /><StatusTag v={v} compact />
                  </span>
                  <span style={{ fontSize: 13, color: v.dateColor }}>{v.dateLabel} · {recurLabel(i.recorrencia)}</span>
                </button>
              </div>
            );
          })}
          <div className="muted" style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: "1px solid var(--color-divider)", fontSize: 14 }}>
            <span>{footCount}</span>
            <strong className="font-heading tabular" style={{ fontSize: 19, color: "var(--color-text)" }}>{footTotal}</strong>
          </div>
        </div>
      )}

      {lItems.length > 0 && rows.length === 0 && (
        <div className="blueprint" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "40px 24px" }}>
          <Corners />
          <span style={{ color: "var(--color-accent)" }}><Icon name="filterX" size={28} /></span>
          <span style={{ fontSize: 16 }}>Nenhuma {lt} {cur[3]} em {monthSlash}.</span>
          <button type="button" className="btn btn-secondary" onClick={() => setLedgerFilter("todas")} style={{ minHeight: "var(--ctl-h)", padding: "0 16px", fontSize: 15 }}>Mostrar todas</button>
        </div>
      )}

      {lItems.length === 0 && (
        <div className="blueprint" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "56px 24px" }}>
          <Corners />
          <span style={{ width: 60, height: 60, display: "grid", placeItems: "center", border: "1px solid var(--color-divider)", color: "var(--color-accent)" }}>
            <Icon name={isC ? "receipt" : "trending"} size={28} />
          </span>
          <h3 style={{ margin: 0, fontSize: 26 }}>Nenhuma {lt} em {monthSlash}</h3>
          <p className="muted" style={{ margin: 0, maxWidth: "38ch" }}>
            {isC ? "Cadastre aluguel, energia, cartão e as outras despesas do mês." : "Cadastre salários, diárias e serviços recebidos no mês."}
          </p>
          <button type="button" className="btn btn-primary blueprint" onClick={() => openForm(tipo)} style={{ minHeight: 44, padding: "0 20px", fontSize: 17, gap: 8, marginTop: 6 }}>
            <Icon name="plus" size={18} />{isC ? "Criar conta" : "Criar receita"}<Corners />
          </button>
        </div>
      )}
    </>
  );
}
