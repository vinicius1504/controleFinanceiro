"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MESES } from "@/lib/meses";
import { fmt, MESES_CURTOS, pad, plural } from "@/lib/format";
import { useFinance, type Item, type LedgerFilter } from "@/components/finance";
import { CatTag, ErrorBanner, LoadingSkeleton, PageHeader, PaidToggle, rowView, StatusTag } from "@/components/page";
import { Corners, Icon, useCompact } from "@/components/ui";

const sum = (a: Item[]) => a.reduce((t, i) => t + i.valor, 0);

/** Passo "redondo" do eixo (1, 2, 2,5 ou 5 × 10ⁿ), para ~4 linhas de grade em qualquer escala. */
function niceStep(raw: number): number {
  if (!(raw > 0)) return 500;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = [1, 2, 2.5, 5, 10].find((x) => x * mag >= raw) ?? 10;
  return Math.max(500, f * mag);
}

function axisLabel(v: number): string {
  if (v === 0) return "0";
  if (v >= 1e6) return `${(v / 1e6).toLocaleString("pt-BR")} mi`;
  return `${(v / 1000).toLocaleString("pt-BR")} mil`;
}

export default function DashboardPage() {
  const { items, loading, error, reload, y, m, setMonth, today, catById, openForm, setLedgerFilter } = useFinance();
  const router = useRouter();
  const compact = useCompact();
  const [tab, setTab] = useState<"proximos" | "recentes">("proximos");

  const prefix = `${y}-${pad(m + 1)}`;
  const monthSlash = `${MESES[m]}/${y}`;

  const d = useMemo(() => {
    const mi = items.filter((i) => i.due.startsWith(prefix));
    const contas = mi.filter((i) => i.tipo === "despesa"), recs = mi.filter((i) => i.tipo === "receita");
    const totC = sum(contas), totR = sum(recs);
    const pagoC = sum(contas.filter((i) => i.is_paid)), recebR = sum(recs.filter((i) => i.is_paid));
    const abertoL = contas.filter((i) => !i.is_paid), vencL = abertoL.filter((i) => i.due < today);

    const g: Record<string, number> = {};
    contas.forEach((i) => { const k = i.categoria_id && catById(i.categoria_id) ? i.categoria_id : "none"; g[k] = (g[k] || 0) + i.valor; });
    const catArr = Object.keys(g).map((k) => { const c = catById(k); return { name: c?.nome ?? "Sem categoria", color: c?.cor || "var(--color-neutral-500)", v: g[k] }; }).sort((a, b) => b.v - a.v);

    const ym = Array.from({ length: 12 }, (_, k) => {
      const its = items.filter((i) => i.due.startsWith(`${y}-${pad(k + 1)}`));
      return { r: sum(its.filter((i) => i.tipo === "receita")), d: sum(its.filter((i) => i.tipo === "despesa")) };
    });

    const byDue = (a: Item, b: Item) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0);
    const prox = abertoL.slice().sort(byDue).slice(0, 6);
    const recent = mi.filter((i) => i.due <= today || i.is_paid).sort((a, b) => -byDue(a, b)).slice(0, 6);

    return { contas, totC, totR, pagoC, recebR, abertoC: totC - pagoC, aRecR: totR - recebR, abertoL, vencL, totV: sum(vencL), catArr, ym, prox, recent };
  }, [items, prefix, today, catById, y]);

  const goLedger = (path: string, filter: LedgerFilter = "todas") => { setLedgerFilter(filter); router.push(path); };

  const header = <PageHeader title="Dashboard" sub="Como está o mês da família" showMonth />;
  if (error) return <>{header}<ErrorBanner title={`Não foi possível carregar os dados de ${monthSlash}`} onRetry={reload} /></>;
  if (loading) return <>{header}<LoadingSkeleton /></>;

  const saldo = d.totR - d.totC;
  const mx = Math.max(d.totR, d.totC) || 1;
  const w = (v: number) => `${((v / mx) * 100).toFixed(2)}%`;
  const cardPad = compact ? 16 : "20px 24px";
  const miniFs = compact ? 24 : 32;

  const miniCards = [
    { kicker: "Receitas", value: fmt(d.totR), color: "var(--color-pos)", sub: "Recebido " + fmt(d.recebR), onClick: () => goLedger("/dashboard/receitas") },
    { kicker: "Despesas", value: fmt(d.totC), color: "var(--color-neg)", sub: "Pago " + fmt(d.pagoC), onClick: () => goLedger("/dashboard/contas") },
    { kicker: "A pagar", value: fmt(d.abertoC), color: "var(--color-text)", sub: d.abertoL.length ? plural(d.abertoL.length, "conta em aberto", "contas em aberto") : "Nada em aberto", onClick: () => goLedger("/dashboard/contas", "aberto") },
    { kicker: "Vencidas", value: fmt(d.totV), color: d.vencL.length ? "var(--color-neg)" : "var(--color-text)", sub: d.vencL.length ? plural(d.vencL.length, "conta passou", "contas passaram") + " do vencimento" : "Nenhuma conta vencida", onClick: () => goLedger("/dashboard/contas", "vencidas") },
  ];

  const listRows = tab === "proximos" ? d.prox : d.recent;
  const listEmptyMsg = tab === "proximos"
    ? (d.contas.length ? `Tudo pago em ${monthSlash}.` : `Nenhuma conta em ${monthSlash}.`)
    : `Nenhum lançamento até hoje em ${monthSlash}.`;

  const cmax = d.catArr.length ? d.catArr[0].v : 1;

  const ymaxRaw = Math.max(...d.ym.map((x) => Math.max(x.r, x.d)));
  const step = niceStep(ymaxRaw / 4);
  const top = Math.max(step, Math.ceil(ymaxRaw / step) * step);
  const H = 170, curKey = today.slice(0, 7);
  const gridLines: { label: string; bottom: number }[] = [];
  for (let v = 0; v <= top; v += step) gridLines.push({ label: axisLabel(v), bottom: 29 + (v / top) * H });
  const ySaldo = d.ym.reduce((t, x) => t + x.r - x.d, 0);

  return (
    <>
      {header}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 20 }}>
        <section className="card blueprint" style={{ padding: 24, gap: 22, justifyContent: "space-between" }}>
          <Corners />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="card-kicker">Saldo de {MESES[m]}</span>
            <span className="font-heading tabular" style={{ fontSize: compact ? 48 : 64, lineHeight: 1, letterSpacing: "-0.02em", color: saldo < 0 ? "var(--color-neg)" : "var(--color-pos)" }}>
              {(saldo < 0 ? "− " : "") + fmt(Math.abs(saldo))}
            </span>
            <span className="muted" style={{ fontSize: 14 }}>{saldo < 0 ? "As despesas passaram as receitas do mês." : "Receitas menos despesas do mês."}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "72px minmax(0,1fr) auto", gap: "12px 14px", alignItems: "center" }}>
              <span style={{ fontSize: 14 }}>Receitas</span>
              <div style={{ height: 14, display: "flex", background: "color-mix(in srgb, var(--color-text) 5%, transparent)" }}>
                <div style={{ width: w(d.recebR), background: "var(--color-pos)" }} /><div className="hatch-pos" style={{ width: w(d.aRecR) }} />
              </div>
              <span className="font-heading tabular" style={{ fontSize: 19, color: "var(--color-pos)", textAlign: "right" }}>{fmt(d.totR)}</span>
              <span style={{ fontSize: 14 }}>Despesas</span>
              <div style={{ height: 14, display: "flex", background: "color-mix(in srgb, var(--color-text) 5%, transparent)" }}>
                <div style={{ width: w(d.pagoC), background: "var(--color-neg)" }} /><div className="hatch-neg" style={{ width: w(d.abertoC) }} />
              </div>
              <span className="font-heading tabular" style={{ fontSize: 19, color: "var(--color-neg)", textAlign: "right" }}>{fmt(d.totC)}</span>
            </div>
            <div className="muted" style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", fontSize: 13 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, background: "var(--color-neutral-700)" }} />Recebido ou pago</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, background: "repeating-linear-gradient(135deg, var(--color-neutral-700) 0 2px, transparent 2px 4px)", boxShadow: "inset 0 0 0 1px var(--color-neutral-700)" }} />A receber ou a pagar</span>
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 20 }}>
          {miniCards.map((c) => (
            <button key={c.kicker} type="button" className="card blueprint card-hover" onClick={c.onClick} style={{ padding: compact ? 14 : "18px 20px", gap: 6, justifyContent: "space-between", minWidth: 0 }}>
              <Corners />
              <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, width: "100%" }}>
                <span className="card-kicker">{c.kicker}</span>
                <span className="muted"><Icon name="arrowUpRight" size={16} /></span>
              </span>
              <span className="font-heading tabular" style={{ fontSize: miniFs, lineHeight: 1.05, color: c.color, overflowWrap: "anywhere" }}>{c.value}</span>
              <span className="muted" style={{ fontSize: 13 }}>{c.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 20, alignItems: "start" }}>
        <section className="card blueprint" style={{ padding: cardPad, gap: 8 }}>
          <Corners />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 25 }}>Lançamentos</h3>
            <div className="seg" role="radiogroup" aria-label="Mostrar">
              <label className="seg-opt" style={{ padding: "0 14px" }}><input type="radio" name="tab" checked={tab === "proximos"} onChange={() => setTab("proximos")} />A vencer</label>
              <label className="seg-opt" style={{ padding: "0 14px" }}><input type="radio" name="tab" checked={tab === "recentes"} onChange={() => setTab("recentes")} />Recentes</label>
            </div>
          </div>
          {listRows.map((i) => {
            const v = rowView(i, catById(i.categoria_id), today);
            return (
              <div key={i.id} className="row-line" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
                <PaidToggle item={i} v={v} size={compact ? 44 : 32} />
                <button type="button" onClick={() => openForm(i.tipo, i)} style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5, padding: 0, border: 0, background: "none", color: "inherit", textAlign: "left", cursor: "pointer" }}>
                  <span style={{ fontSize: 15, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
                    {i.desc}{i.parcel && <span className="muted" style={{ fontWeight: 400, fontSize: 13 }}> · parcela {i.parcel.n}/{i.parcel.total}</span>}
                  </span>
                  <span className="muted" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px 10px", fontSize: 13 }}>
                    <CatTag v={v} compact /><span style={{ color: v.dateColor }}>{v.dateLabel}</span>
                  </span>
                </button>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flex: "none" }}>
                  <span className="font-heading tabular" style={{ fontSize: 19, whiteSpace: "nowrap", color: v.valueColor }}>{(i.tipo === "despesa" ? "− " : "+ ") + fmt(i.valor)}</span>
                  <StatusTag v={v} compact />
                </div>
              </div>
            );
          })}
          {listRows.length === 0 && (
            <div className="row-line" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10, padding: "28px 12px" }}>
              <span style={{ color: "var(--color-accent)" }}><Icon name="circleCheck" size={28} /></span>
              <span style={{ fontSize: 15 }}>{listEmptyMsg}</span>
            </div>
          )}
          <div className="row-line" style={{ display: "flex", justifyContent: "flex-end", paddingTop: 6 }}>
            <button type="button" className="btn btn-ghost" onClick={() => goLedger("/dashboard/contas")} style={{ fontSize: 15, minHeight: 40, gap: 4, color: "var(--color-accent-700)" }}>
              Ver todas as contas<Icon name="arrowRight" size={16} />
            </button>
          </div>
        </section>

        <section className="card blueprint" style={{ padding: cardPad, gap: 18 }}>
          <Corners />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 25 }}>Despesas por categoria</h3>
            <span className="muted" style={{ fontSize: 14 }}>Total {fmt(d.totC)}</span>
          </div>
          {d.catArr.length > 0 ? (
            <>
              <div style={{ display: "flex", height: 16, gap: 2 }}>
                {d.catArr.map((c) => <span key={c.name} title={c.name} style={{ flex: `${Math.max(1, Math.round(c.v))} 1 0`, minWidth: 3, background: c.color }} />)}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {d.catArr.map((c) => (
                  <div key={c.name} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: "6px 14px", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, fontSize: 15 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", flex: "none", background: c.color }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    </span>
                    <span className="muted tabular" style={{ fontSize: 13 }}>{d.totC ? Math.round((c.v / d.totC) * 100) : 0}%</span>
                    <span className="font-heading tabular" style={{ fontSize: 17, textAlign: "right", minWidth: 96 }}>{fmt(c.v)}</span>
                    <div style={{ gridColumn: "1 / -1", height: 6, background: "color-mix(in srgb, var(--color-text) 6%, transparent)" }}>
                      <div style={{ height: "100%", width: `${((c.v / cmax) * 100).toFixed(1)}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="muted" style={{ margin: 0, padding: "20px 0", textAlign: "center" }}>Nenhuma despesa em {monthSlash}.</p>
          )}
        </section>
      </div>

      <section className="card blueprint" style={{ padding: cardPad, gap: 18 }}>
        <Corners />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px 24px", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: 25 }}>Visão de {y}</h3>
            <span className="muted" style={{ fontSize: 14 }}>Toque em um mês para ver os detalhes. Meses futuros mostram o previsto.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", fontSize: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, background: "var(--color-pos)" }} />Receitas</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, background: "var(--color-neg)" }} />Despesas</span>
            <span>Saldo do ano <strong className="font-heading tabular" style={{ fontSize: 19, color: ySaldo < 0 ? "var(--color-neg)" : "var(--color-pos)" }}>{(ySaldo < 0 ? "− " : "") + fmt(Math.abs(ySaldo))}</strong></span>
          </div>
        </div>
        <div style={{ position: "relative", height: 200, paddingLeft: 44 }}>
          {gridLines.map((g) => (
            <div key={g.bottom} style={{ position: "absolute", left: 44, right: 0, bottom: g.bottom, borderTop: "1px dashed var(--color-divider)" }}>
              <span className="muted" style={{ position: "absolute", right: "calc(100% + 6px)", top: -9, fontSize: 11, whiteSpace: "nowrap" }}>{g.label}</span>
            </div>
          ))}
          <div style={{ position: "relative", height: "100%", display: "flex", gap: compact ? 2 : 6 }}>
            {d.ym.map((x, k) => {
              const key = `${y}-${pad(k + 1)}`, fut = key > curKey, act = k === m;
              const title = `${MESES[k]}: receitas ${fmt(x.r)}, despesas ${fmt(x.d)}${fut ? " (previsto)" : ""}`;
              return (
                <button key={k} type="button" className="year-col" onClick={() => setMonth(y, k)} title={title} aria-label={title} aria-pressed={act}
                  style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 0, cursor: "pointer", color: "inherit" }}>
                  <span style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 2, height: H }}>
                    <span className={fut ? "hatch-pos" : undefined} style={{ width: "36%", maxWidth: 14, height: Math.round((x.r / top) * H), background: fut ? undefined : "var(--color-pos)" }} />
                    <span className={fut ? "hatch-neg" : undefined} style={{ width: "36%", maxWidth: 14, height: Math.round((x.d / top) * H), background: fut ? undefined : "var(--color-neg)" }} />
                  </span>
                  <span style={{ height: 28, display: "grid", placeItems: "center", fontSize: 12, color: act ? "var(--color-accent-700)" : "var(--color-neutral-700)", fontWeight: act ? 600 : 400 }}>{MESES_CURTOS[k]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
