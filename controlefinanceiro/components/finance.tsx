"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { addMonthsClamped } from "@/lib/dates";
import { br, fmt, fromBr, maskDate, maskMoney, num2, pad, parseMoney, RECORRENCIAS, splitParcel, todayISO } from "@/lib/format";
import { CheckRow, ConfirmDialog, Corners, FieldError, Icon, Modal, ModalHeader, useToast } from "./ui";

export type Categoria = { id: string; nome: string; cor: string | null };

export type Transacao = {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  recorrencia: string;
  is_paid: boolean;
  data_vencimento: string;
  data_pagamento: string | null;
  categoria_id: string | null;
};

/** Transação com a parcela ("(3/10)") separada da descrição. */
export type Item = Transacao & { desc: string; parcel: { n: number; total: number } | null; due: string };

export type LedgerFilter = "todas" | "aberto" | "pagas" | "vencidas";

type Confirm = { title: string; body: string; label: string; action: () => void | Promise<void> };

type Ctx = {
  items: Item[];
  categorias: Categoria[];
  setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  y: number;
  m: number;
  setMonth: (y: number, m: number) => void;
  today: string;
  ledgerFilter: LedgerFilter;
  setLedgerFilter: (f: LedgerFilter) => void;
  openLancar: () => void;
  openForm: (tipo: "receita" | "despesa", item?: Item) => void;
  togglePaid: (item: Item) => Promise<void>;
  askDelete: (item: Item) => void;
  askConfirm: (c: Confirm) => void;
  catById: (id: string | null) => Categoria | undefined;
};

const FinanceCtx = createContext<Ctx | null>(null);

export function useFinance() {
  const c = useContext(FinanceCtx);
  if (!c) throw new Error("useFinance fora do FinanceProvider");
  return c;
}

function toItem(t: Transacao): Item {
  const { desc, parcel } = splitParcel(t.descricao);
  return { ...t, valor: Number(t.valor), desc, parcel, due: t.data_vencimento.slice(0, 10) };
}

function payload(t: Transacao) {
  return {
    descricao: t.descricao,
    valor: t.valor,
    tipo: t.tipo,
    recorrencia: t.recorrencia,
    is_paid: t.is_paid,
    data_vencimento: t.data_vencimento.slice(0, 10),
    data_pagamento: t.data_pagamento ? t.data_pagamento.slice(0, 10) : null,
    categoria_id: t.categoria_id,
  };
}

async function readError(res: Response, fallback: string) {
  try { return (await res.json()).error || fallback; } catch { return fallback; }
}

type FormState = {
  id?: string;
  tipo: "receita" | "despesa";
  desc: string;
  valor: string;
  cat: string;
  parcelada: boolean;
  parcelas: string;
  parcel: Item["parcel"];
  venc: string;
  recur: string;
  pago: boolean;
  dataPag: string;
  orig?: Item;
};

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const today = todayISO();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [y, setY] = useState(() => Number(today.slice(0, 4)));
  const [m, setM] = useState(() => Number(today.slice(5, 7)) - 1);
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>("todas");
  const [modal, setModal] = useState<null | "lancar" | "form">(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [tRes, cRes] = await Promise.all([apiFetch("/api/transacoes"), apiFetch("/api/categorias")]);
      if (!tRes.ok) throw new Error(await readError(tRes, "Erro ao carregar lançamentos"));
      if (!cRes.ok) throw new Error(await readError(cRes, "Erro ao carregar categorias"));
      setTransacoes((await tRes.json()).transacoes ?? []);
      setCategorias((await cRes.json()).categorias ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar os dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const items = useMemo(() => transacoes.map(toItem), [transacoes]);
  const catById = useCallback((id: string | null) => categorias.find((c) => c.id === id), [categorias]);

  const setMonth = useCallback((ny: number, nm: number) => { setY(ny); setM(nm); }, []);

  const putTransacao = useCallback(async (t: Transacao) => {
    const res = await apiFetch(`/api/transacoes/${t.id}`, { method: "PUT", body: JSON.stringify(payload(t)) });
    if (!res.ok) throw new Error(await readError(res, "Erro ao salvar"));
    const saved: Transacao = (await res.json()).transacao;
    setTransacoes((list) => list.map((x) => (x.id === saved.id ? saved : x)));
  }, []);

  const togglePaid = useCallback(async (item: Item) => {
    const orig: Transacao = { ...item };
    const paid = !item.is_paid;
    const next: Transacao = { ...orig, is_paid: paid, data_pagamento: paid ? today : null };
    const isC = item.tipo === "despesa";
    setTransacoes((list) => list.map((x) => (x.id === item.id ? next : x)));
    try {
      await putTransacao(next);
      const msg = paid
        ? (isC ? "Pagamento registrado: " : "Recebimento registrado: ") + item.desc
        : `${item.desc} voltou para ${isC ? "Em aberto" : "A receber"}`;
      toast(msg, () => {
        setTransacoes((list) => list.map((x) => (x.id === item.id ? orig : x)));
        putTransacao(orig).catch(() => toast("Não foi possível desfazer. Recarregue a página."));
      });
    } catch {
      setTransacoes((list) => list.map((x) => (x.id === item.id ? orig : x)));
      toast("Não foi possível atualizar. Tente de novo.");
    }
  }, [putTransacao, toast, today]);

  const askDelete = useCallback((item: Item) => {
    const isC = item.tipo === "despesa";
    setConfirm({
      title: isC ? "Excluir conta?" : "Excluir receita?",
      body: `“${item.desc}”, de ${fmt(item.valor)}${isC ? ", com vencimento em " : ", prevista para "}${br(item.due)}, será excluída para toda a família.`,
      label: "Excluir",
      action: async () => {
        const res = await apiFetch(`/api/transacoes/${item.id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) { toast(await readError(res, "Erro ao excluir")); return; }
        setTransacoes((list) => list.filter((x) => x.id !== item.id));
        setModal(null);
        toast((isC ? "Conta excluída: " : "Receita excluída: ") + item.desc, async () => {
          const r = await apiFetch("/api/transacoes", { method: "POST", body: JSON.stringify(payload(item)) });
          if (r.ok) { const saved = (await r.json()).transacao; setTransacoes((list) => [...list, saved]); }
          else toast("Não foi possível desfazer.");
        });
      },
    });
  }, [toast]);

  const openForm = useCallback((tipo: "receita" | "despesa", item?: Item) => {
    const sameMonth = `${y}-${pad(m + 1)}` === today.slice(0, 7);
    const defVenc = sameMonth ? br(today) : `10/${pad(m + 1)}/${y}`;
    setForm(item
      ? { id: item.id, tipo, desc: item.desc, valor: num2(item.valor), cat: item.categoria_id || "", parcelada: false, parcelas: "2", parcel: item.parcel, venc: br(item.due), recur: item.recorrencia, pago: item.is_paid, dataPag: br(item.data_pagamento || today), orig: item }
      : { tipo, desc: "", valor: "", cat: "", parcelada: false, parcelas: "2", parcel: null, venc: defVenc, recur: "unica", pago: false, dataPag: br(today) });
    setErrs({});
    setModal("form");
  }, [m, today, y]);

  const setF = (patch: Partial<FormState>) => {
    setForm((f) => {
      if (!f) return f;
      const nf = { ...f, ...patch };
      if (patch.parcelada) nf.recur = "mensal";
      return nf;
    });
    setErrs((e) => { const n = { ...e }; Object.keys(patch).forEach((k) => delete n[k]); return n; });
  };

  async function saveForm(ev: React.FormEvent) {
    ev.preventDefault();
    if (!form) return;
    const f = form, e: Record<string, string> = {}, isC = f.tipo === "despesa";
    if (!f.desc.trim()) e.desc = "Informe uma descrição.";
    const v = parseMoney(f.valor);
    if (!(v > 0)) e.valor = "Informe um valor maior que zero.";
    const due = fromBr(f.venc);
    if (!due) e.venc = "Data inválida. Use dd/mm/aaaa.";
    let pd: string | null = null;
    if (f.pago) { pd = fromBr(f.dataPag); if (!pd) e.dataPag = "Data inválida. Use dd/mm/aaaa."; }
    const n = parseInt(f.parcelas, 10), parc = isC && f.parcelada && !f.id;
    if (parc && !(n >= 2 && n <= 48)) e.parcelas = "Use de 2 a 48 parcelas.";
    if (Object.keys(e).length) { setErrs(e); return; }

    setSaving(true);
    const desc = f.desc.trim();
    try {
      let msg: string;
      if (f.id && f.orig) {
        const descricao = f.parcel ? `${desc} (${f.parcel.n}/${f.parcel.total})` : desc;
        await putTransacao({ ...f.orig, descricao, valor: v, categoria_id: f.cat || null, data_vencimento: due!, recorrencia: f.recur, is_paid: f.pago, data_pagamento: f.pago ? pd : null });
        msg = "Alterações salvas";
      } else {
        const novos: Omit<Transacao, "id">[] = parc
          ? Array.from({ length: n }, (_, k) => ({ descricao: `${desc} (${k + 1}/${n})`, valor: v, tipo: "despesa" as const, recorrencia: "unica", is_paid: k === 0 && f.pago, data_vencimento: addMonthsClamped(due!, k), data_pagamento: k === 0 && f.pago ? pd : null, categoria_id: f.cat || null }))
          : [{ descricao: desc, valor: v, tipo: f.tipo, recorrencia: f.recur, is_paid: f.pago, data_vencimento: due!, data_pagamento: f.pago ? pd : null, categoria_id: f.cat || null }];
        const criados: Transacao[] = [];
        for (const t of novos) {
          const res = await apiFetch("/api/transacoes", { method: "POST", body: JSON.stringify(t) });
          if (!res.ok) throw new Error(await readError(res, "Erro ao salvar"));
          criados.push((await res.json()).transacao);
        }
        setTransacoes((list) => [...list, ...criados]);
        msg = parc
          ? `${n} parcelas criadas, de ${br(due!)} a ${br(addMonthsClamped(due!, n - 1))}`
          : (isC ? "Conta salva: " : "Receita salva: ") + desc;
      }
      setModal(null);
      setForm(null);
      toast(msg);
    } catch (err) {
      setErrs({ form: err instanceof Error ? err.message : "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  }

  const closeModal = useCallback(() => { setModal(null); setErrs({}); }, []);

  const value: Ctx = {
    items, categorias, setCategorias, loading, error, reload, y, m, setMonth, today, ledgerFilter, setLedgerFilter,
    openLancar: () => setModal("lancar"), openForm, togglePaid, askDelete, askConfirm: setConfirm, catById,
  };

  const F = form;
  const isContaF = F?.tipo === "despesa";
  const nParc = parseInt(F?.parcelas || "", 10) || 0, pv = parseMoney(F?.valor || ""), fdue = fromBr(F?.venc || "");
  const parcelaHint = nParc >= 2 && pv > 0
    ? `${nParc} × ${fmt(pv)} = ${fmt(nParc * pv)}${fdue ? `. Última em ${br(addMonthsClamped(fdue, nParc - 1))}.` : ""}`
    : "Informe o valor de cada parcela.";
  const recurDisabled = !!(isContaF && F?.parcelada && !F?.id);
  const fCat = F ? catById(F.cat || null) : undefined;
  const dashedBox: React.CSSProperties = { display: "flex", padding: "14px 16px", border: "1px dashed var(--color-divider)" };

  return (
    <FinanceCtx.Provider value={value}>
      {children}

      <Modal open={modal === "lancar"} onClose={closeModal} width={520} dismissOnBackdrop>
        <ModalHeader title="O que você quer lançar?" sub="Escolha o tipo e preencha em seguida." onClose={closeModal} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 16, paddingBottom: 6 }}>
          {([
            ["despesa", "Conta", "Despesa, boleto ou compra", "arrowDown", "neg"],
            ["receita", "Receita", "Salário, diária ou serviço", "arrowUp", "pos"],
          ] as const).map(([tipo, title, sub, icon, tone]) => (
            <button key={tipo} type="button" className="blueprint card-hover" onClick={() => openForm(tipo)} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, padding: 20, background: "transparent" }}>
              <Corners />
              <span style={{ width: 44, height: 44, display: "grid", placeItems: "center", background: `var(--color-${tone}-bg)`, color: `var(--color-${tone})` }}><Icon name={icon} size={22} /></span>
              <span className="font-heading" style={{ fontSize: 24, lineHeight: 1 }}>{title}</span>
              <span className="muted" style={{ fontSize: 14 }}>{sub}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={modal === "form" && !!F} onClose={closeModal} width={580}>
        {F && (
          <>
            <ModalHeader
              title={(F.id ? "Editar " : "Nova ") + (isContaF ? "conta" : "receita")}
              sub={F.id ? "As alterações valem para toda a família." : "O lançamento aparece para toda a família."}
              onClose={closeModal}
            />
            <form onSubmit={saveForm} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {errs.form && (
                <div role="alert" style={{ display: "flex", gap: 10, padding: "12px 14px", border: "1px solid var(--color-neg)", background: "var(--color-neg-bg)", fontSize: 14 }}>
                  <Icon name="alert" size={18} /><span>{errs.form}</span>
                </div>
              )}
              <div className="field">
                <label htmlFor="f-desc">Descrição</label>
                <input id="f-desc" className="input" autoFocus placeholder={isContaF ? "Ex.: Aluguel, Energia, Cartão" : "Ex.: Salário, Diária, Serviço"} value={F.desc} onChange={(e) => setF({ desc: e.target.value })} aria-invalid={!!errs.desc || undefined} />
                <FieldError msg={errs.desc} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
                <div className="field">
                  <label htmlFor="f-valor">{isContaF && (F.parcelada || F.parcel) ? "Valor da parcela" : "Valor"}</label>
                  <div style={{ position: "relative" }}>
                    <span className="muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>R$</span>
                    <input id="f-valor" className="input tabular" inputMode="numeric" placeholder="0,00" value={F.valor} onChange={(e) => setF({ valor: maskMoney(e.target.value) })} aria-invalid={!!errs.valor || undefined} style={{ fontSize: 17, paddingLeft: 40 }} />
                  </div>
                  <FieldError msg={errs.valor} />
                </div>
                <div className="field">
                  <label htmlFor="f-cat">Categoria</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 10, height: 10, borderRadius: "50%", background: fCat?.cor || "var(--color-neutral-400)", pointerEvents: "none" }} />
                    <select id="f-cat" className="input" value={F.cat} onChange={(e) => setF({ cat: e.target.value })} style={{ paddingLeft: 30, cursor: "pointer" }}>
                      <option value="">Sem categoria</option>
                      {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {isContaF && !F.id && (
                <div style={{ ...dashedBox, flexDirection: "column", gap: 12 }}>
                  <CheckRow checked={F.parcelada} onChange={(v) => setF({ parcelada: v })}>Compra parcelada</CheckRow>
                  {F.parcelada && (
                    <>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flexWrap: "wrap" }}>
                        <div className="field" style={{ width: 150 }}>
                          <label htmlFor="f-parc">Número de parcelas</label>
                          <input id="f-parc" className="input" type="number" min={2} max={48} inputMode="numeric" value={F.parcelas} onChange={(e) => setF({ parcelas: e.target.value.replace(/\D/g, "").slice(0, 2) })} aria-invalid={!!errs.parcelas || undefined} />
                        </div>
                        <span className="tabular" style={{ flex: 1, minWidth: 180, fontSize: 14, paddingBottom: 10 }}>{parcelaHint}</span>
                      </div>
                      <FieldError msg={errs.parcelas} />
                    </>
                  )}
                </div>
              )}
              {F.parcel && <div className="muted" style={{ fontSize: 14 }}>Parcela {F.parcel.n} de {F.parcel.total}. As outras parcelas não mudam.</div>}

              <div className="field">
                <label htmlFor="f-venc">{isContaF ? "Data de vencimento" : "Data prevista"}</label>
                <input id="f-venc" className="input tabular" inputMode="numeric" placeholder="dd/mm/aaaa" value={F.venc} onChange={(e) => setF({ venc: maskDate(e.target.value) })} aria-invalid={!!errs.venc || undefined} style={{ maxWidth: 220 }} />
                <FieldError msg={errs.venc} />
              </div>

              <div className="field">
                <span className="field-label">Recorrência</span>
                <div className="seg" role="radiogroup" aria-label="Recorrência" style={{ display: "flex", width: "100%", opacity: recurDisabled ? 0.55 : 1 }}>
                  {RECORRENCIAS.map((r) => (
                    <label key={r.value} className="seg-opt" style={{ flex: 1, justifyContent: "center", fontSize: 14 }}>
                      <input type="radio" name="recur" checked={F.recur === r.value} onChange={() => setF({ recur: r.value })} disabled={recurDisabled} />{r.label}
                    </label>
                  ))}
                </div>
                {recurDisabled && <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>Compras parceladas se repetem todo mês até a última parcela.</div>}
              </div>

              <div style={{ ...dashedBox, alignItems: "flex-end", gap: "14px 20px", flexWrap: "wrap" }}>
                <div style={{ minHeight: "var(--ctl-h)", display: "flex", alignItems: "center" }}>
                  <CheckRow checked={F.pago} onChange={(v) => setF({ pago: v })}>{isContaF ? "Já está pago" : "Já foi recebido"}</CheckRow>
                </div>
                {F.pago && (
                  <div className="field" style={{ width: 200 }}>
                    <label htmlFor="f-pag">{isContaF ? "Data de pagamento" : "Data de recebimento"}</label>
                    <input id="f-pag" className="input tabular" inputMode="numeric" placeholder="dd/mm/aaaa" value={F.dataPag} onChange={(e) => setF({ dataPag: maskDate(e.target.value) })} aria-invalid={!!errs.dataPag || undefined} />
                  </div>
                )}
                {errs.dataPag && <div className="field-error" style={{ width: "100%", marginTop: 0 }}>{errs.dataPag}</div>}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
                {F.id && F.orig && (
                  <button type="button" className="btn btn-ghost" onClick={() => askDelete(F.orig!)} style={{ minHeight: "var(--ctl-h)", padding: "0 10px", fontSize: 15, color: "var(--color-neg)" }}>
                    <Icon name="trash" size={16} />Excluir
                  </button>
                )}
                <span style={{ flex: 1 }} />
                <button type="button" className="btn btn-secondary" onClick={closeModal} style={{ minHeight: "var(--ctl-h)", padding: "0 18px", fontSize: 16 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary blueprint" disabled={saving} style={{ minHeight: "var(--ctl-h)", padding: "0 22px", fontSize: 16 }}>
                  {saving ? "Salvando…" : isContaF ? "Salvar conta" : "Salvar receita"}<Corners />
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        label={confirm?.label ?? ""}
        onClose={() => setConfirm(null)}
        onConfirm={async () => { const c = confirm; setConfirm(null); await c?.action(); }}
      />
    </FinanceCtx.Provider>
  );
}
