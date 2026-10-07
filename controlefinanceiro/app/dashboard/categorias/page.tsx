"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { PALETTE, plural } from "@/lib/format";
import { useFinance, type Categoria } from "@/components/finance";
import { ErrorBanner, LoadingSkeleton, PageHeader } from "@/components/page";
import { Corners, FieldError, Icon, Modal, ModalHeader, useCompact, useToast } from "@/components/ui";

type CatForm = { id: string | null; name: string; color: string; hex: string };

export default function CategoriasPage() {
  const { categorias, setCategorias, items, y, loading, error, reload, askConfirm } = useFinance();
  const toast = useToast();
  const compact = useCompact();
  const [cf, setCf] = useState<CatForm | null>(null);
  const [cfErr, setCfErr] = useState("");
  const [saving, setSaving] = useState(false);

  const openCat = (c?: Categoria) => {
    const col = c?.cor || PALETTE[0][0];
    setCf({ id: c?.id ?? null, name: c?.nome ?? "", color: col, hex: col.toUpperCase() });
    setCfErr("");
  };
  const patch = (o: Partial<CatForm>) => { setCf((f) => (f ? { ...f, ...o } : f)); setCfErr(""); };

  async function saveCat(ev: React.FormEvent) {
    ev.preventDefault();
    if (!cf) return;
    const name = cf.name.trim();
    if (!name) { setCfErr("Dê um nome para a categoria."); return; }
    if (categorias.some((x) => x.id !== cf.id && x.nome.toLowerCase() === name.toLowerCase())) { setCfErr("Já existe uma categoria com esse nome."); return; }
    setSaving(true);
    try {
      const res = await apiFetch(cf.id ? `/api/categorias/${cf.id}` : "/api/categorias", { method: cf.id ? "PUT" : "POST", body: JSON.stringify({ nome: name, cor: cf.color }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar categoria");
      const saved: Categoria = data.categoria;
      setCategorias((list) => (cf.id ? list.map((x) => (x.id === saved.id ? saved : x)) : [...list, saved]).sort((a, b) => a.nome.localeCompare(b.nome)));
      setCf(null);
      toast((cf.id ? "Categoria atualizada: " : "Categoria criada: ") + name);
    } catch (e) {
      setCfErr(e instanceof Error ? e.message : "Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  }

  const askDeleteCat = (c: Categoria) => askConfirm({
    title: "Excluir categoria?",
    body: `“${c.nome}” será excluída. Os lançamentos dessa categoria ficarão como “Sem categoria”.`,
    label: "Excluir",
    action: async () => {
      const res = await apiFetch(`/api/categorias/${c.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) { toast("Não foi possível excluir a categoria."); return; }
      setCategorias((list) => list.filter((x) => x.id !== c.id));
      toast("Categoria excluída: " + c.nome);
    },
  });

  const header = <PageHeader title="Categorias" sub="Organize os lançamentos. A cor escolhida aparece nos gráficos e etiquetas." action={{ label: "Nova categoria", onClick: () => openCat() }} />;
  if (error) return <>{header}<ErrorBanner title="Não foi possível carregar as categorias" onRetry={reload} /></>;
  if (loading) return <>{header}<LoadingSkeleton /></>;

  const counts: Record<string, number> = {};
  items.filter((i) => i.due.startsWith(String(y))).forEach((i) => { if (i.categoria_id) counts[i.categoria_id] = (counts[i.categoria_id] || 0) + 1; });
  const btnS = compact ? 44 : 32;

  return (
    <>
      {header}
      <div className="blueprint" style={{ padding: "2px 20px" }}>
        <Corners />
        {categorias.map((c, idx) => {
          const color = c.cor || "var(--color-neutral-500)";
          return (
            <div key={c.id} className={idx ? "row-line" : undefined} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0" }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", flex: "none", background: color }} />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{c.nome}</span>
                <span className="muted" style={{ fontSize: 13 }}>{counts[c.id] ? `${plural(counts[c.id], "lançamento", "lançamentos")} em ${y}` : `Sem lançamentos em ${y}`}</span>
              </div>
              {!compact && (
                <span className="tag" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color: "var(--color-text)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />{c.nome}
                </span>
              )}
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => openCat(c)} aria-label="Editar categoria" title="Editar" style={{ width: btnS, height: btnS, color: "var(--color-text)" }}><Icon name="pencil" size={17} /></button>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => askDeleteCat(c)} aria-label="Excluir categoria" title="Excluir" style={{ width: btnS, height: btnS, color: "var(--color-text)" }}><Icon name="trash" size={17} /></button>
            </div>
          );
        })}
        {categorias.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12, padding: "48px 12px" }}>
            <h3 style={{ margin: 0, fontSize: 26 }}>Nenhuma categoria ainda</h3>
            <p className="muted" style={{ margin: 0, maxWidth: "36ch" }}>Crie categorias como Alimentação ou Transporte para ver para onde vai o dinheiro.</p>
            <button type="button" className="btn btn-primary blueprint" onClick={() => openCat()} style={{ minHeight: 44, padding: "0 20px", fontSize: 17 }}>Criar categoria<Corners /></button>
          </div>
        )}
      </div>

      <Modal open={!!cf} onClose={() => setCf(null)} width={500}>
        {cf && (
          <>
            <ModalHeader title={cf.id ? "Editar categoria" : "Nova categoria"} onClose={() => setCf(null)} />
            <form onSubmit={saveCat} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="field">
                <label htmlFor="cf-nome">Nome</label>
                <input id="cf-nome" className="input" autoFocus placeholder="Ex.: Alimentação, Transporte" value={cf.name} onChange={(e) => patch({ name: e.target.value })} aria-invalid={!!cfErr || undefined} />
                <FieldError msg={cfErr} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span className="field-label" style={{ marginBottom: 0 }}>Cor</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0,1fr))", gap: 10, maxWidth: 340 }}>
                  {PALETTE.map(([color, label]) => {
                    const sel = cf.color.toLowerCase() === color;
                    return (
                      <button key={color} type="button" onClick={() => patch({ color, hex: color.toUpperCase() })} aria-label={label} title={label} aria-pressed={sel}
                        style={{ aspectRatio: "1", minHeight: 40, borderRadius: "50%", padding: 0, background: color, border: "2px solid var(--color-bg)", boxShadow: sel ? "0 0 0 2px var(--color-text)" : "none", display: "grid", placeItems: "center", color: "#fff", cursor: "pointer" }}>
                        {sel && <Icon name="check" size={18} strokeWidth={2} />}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  <label htmlFor="cf-cor" style={{ fontSize: 14 }}>Outra cor</label>
                  <input id="cf-cor" type="color" value={cf.color} onChange={(e) => patch({ color: e.target.value, hex: e.target.value.toUpperCase() })} style={{ width: 48, height: 40, padding: 2, border: "1px solid var(--color-divider)", background: "transparent", cursor: "pointer" }} />
                  <input className="input tabular" value={cf.hex} maxLength={7} aria-label="Código da cor"
                    onChange={(e) => { const v = e.target.value.trim(); patch(/^#[0-9a-fA-F]{6}$/.test(v) ? { hex: v, color: v.toLowerCase() } : { hex: v }); }}
                    style={{ width: 120, minHeight: 40, textTransform: "uppercase" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "1px dashed var(--color-divider)" }}>
                <span className="muted" style={{ fontSize: 13 }}>Prévia</span>
                <span className="tag" style={{ background: `color-mix(in srgb, ${cf.color} 16%, transparent)`, color: "var(--color-text)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: cf.color }} />{cf.name.trim() || "Nova categoria"}
                </span>
                <div style={{ flex: 1, height: 8, background: cf.color }} />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setCf(null)} style={{ minHeight: "var(--ctl-h)", padding: "0 18px", fontSize: 16 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary blueprint" disabled={saving} style={{ minHeight: "var(--ctl-h)", padding: "0 22px", fontSize: 16 }}>
                  {saving ? "Salvando…" : "Salvar categoria"}<Corners />
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
