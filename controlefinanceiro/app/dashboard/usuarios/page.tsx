"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getStoredUser, type StoredUser } from "@/lib/auth";
import { br, emailOk } from "@/lib/format";
import { useFinance } from "@/components/finance";
import { ErrorBanner, LoadingSkeleton, PageHeader } from "@/components/page";
import { Corners, FieldError, Icon, Modal, ModalHeader, PasswordInput, useCompact, useToast } from "@/components/ui";

type Usuario = { id: string; name: string; email: string; created_at: string };
type Row = Usuario & { admin: boolean; isYou: boolean };

export default function UsuariosPage() {
  const router = useRouter();
  const toast = useToast();
  const compact = useCompact();
  const { askConfirm } = useFinance();
  const [me, setMe] = useState<StoredUser | null>(null);
  const [membros, setMembros] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mf, setMf] = useState<{ nome: string; email: string; senha: string } | null>(null);
  const [merrs, setMerrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/usuarios");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMembros(data.usuarios ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const u = getStoredUser();
    setMe(u);
    if (u?.role === "membro") router.replace("/dashboard");
    else load();
  }, [load, router]);

  const setM = (k: "nome" | "email" | "senha", v: string) => {
    setMf((f) => (f ? { ...f, [k]: v } : f));
    setMerrs((e) => { const n = { ...e }; delete n[k]; delete n.form; return n; });
  };

  async function saveMember(ev: React.FormEvent) {
    ev.preventDefault();
    if (!mf) return;
    const e: Record<string, string> = {};
    if (!mf.nome.trim()) e.nome = "Informe o nome completo.";
    if (!emailOk(mf.email)) e.email = "Digite um e-mail válido.";
    else if (membros.some((u) => u.email.toLowerCase() === mf.email.trim().toLowerCase()) || me?.email.toLowerCase() === mf.email.trim().toLowerCase()) e.email = "Esse e-mail já está na família.";
    if (mf.senha.length < 6) e.senha = "A senha precisa ter pelo menos 6 caracteres.";
    if (Object.keys(e).length) { setMerrs(e); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/usuarios", { method: "POST", body: JSON.stringify({ name: mf.nome.trim(), email: mf.email.trim(), password: mf.senha }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao adicionar membro");
      setMembros((list) => [...list, data.usuario]);
      setMf(null);
      toast("Membro adicionado: " + mf.nome.trim());
    } catch (err) {
      setMerrs({ form: err instanceof Error ? err.message : "Erro ao adicionar membro" });
    } finally {
      setSaving(false);
    }
  }

  const askDeleteUser = (u: Usuario) => askConfirm({
    title: "Remover membro?",
    body: `${u.name} não vai mais conseguir entrar nem ver os dados da família. Os lançamentos já feitos continuam salvos.`,
    label: "Remover",
    action: async () => {
      const res = await apiFetch(`/api/usuarios/${u.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) { toast("Não foi possível remover o membro."); return; }
      setMembros((list) => list.filter((x) => x.id !== u.id));
      toast("Membro removido: " + u.name);
    },
  });

  const header = <PageHeader title="Membros da família" sub="Os membros veem e lançam nos mesmos dados da família." action={{ label: "Novo membro", onClick: () => { setMf({ nome: "", email: "", senha: "" }); setMerrs({}); } }} />;
  if (error) return <>{header}<ErrorBanner title="Não foi possível carregar os membros" detail={error} onRetry={load} /></>;
  if (loading || !me) return <>{header}<LoadingSkeleton /></>;

  // A API lista só os membros; o próprio admin entra no topo da lista.
  const rows: Row[] = [
    { id: me.id, name: me.name || me.email, email: me.email, created_at: "", admin: true, isYou: true },
    ...membros.map((u) => ({ ...u, admin: false, isYou: false })),
  ];
  const roleTag = (u: Row, small?: boolean) => (
    <span className="tag" style={{ padding: small ? "2px 8px" : undefined, background: u.admin ? "var(--color-accent-100)" : "transparent", color: u.admin ? "var(--color-accent-800)" : "var(--color-neutral-800)", boxShadow: `inset 0 0 0 1px ${u.admin ? "transparent" : "var(--color-divider)"}` }}>
      {u.admin ? "Administrador" : "Membro"}
    </span>
  );
  const avatar = (u: Row, s: number) => (
    <span className="font-heading" style={{ width: s, height: s, flex: "none", display: "grid", placeItems: "center", background: "var(--color-accent-100)", color: "var(--color-accent-800)", fontSize: s * 0.47 }}>
      {u.name.trim().charAt(0).toUpperCase()}
    </span>
  );
  const nameEl = (u: Row, fs: number) => (
    <span style={{ fontSize: fs, fontWeight: 500 }}>{u.name}{u.isYou && <span className="muted" style={{ fontWeight: 400 }}> (você)</span>}</span>
  );
  const delBtn = (u: Row, s?: number) => !u.admin && (
    <button type="button" className="btn btn-ghost btn-icon" onClick={() => askDeleteUser(u)} aria-label="Remover membro" title="Remover membro" style={{ width: s, height: s, color: "var(--color-text)" }}>
      <Icon name="trash" size={17} />
    </button>
  );

  return (
    <>
      {header}
      {!compact ? (
        <div className="blueprint" style={{ padding: "4px 16px 8px" }}>
          <Corners />
          <table className="table">
            <thead><tr><th>Membro</th><th>E-mail</th><th>Papel</th><th>Cadastro</th><th style={{ width: 60 }} /></tr></thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 12 }}>{avatar(u, 38)}{nameEl(u, 15)}</div></td>
                  <td className="muted">{u.email}</td>
                  <td>{roleTag(u)}</td>
                  <td className="tabular">{u.created_at ? br(u.created_at) : "—"}</td>
                  <td style={{ textAlign: "right" }}>{delBtn(u)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="blueprint" style={{ padding: "2px 14px" }}>
          <Corners />
          {rows.map((u, idx) => (
            <div key={u.id} className={idx ? "row-line" : undefined} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0" }}>
              {avatar(u, 44)}
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                {nameEl(u, 16)}
                <span className="muted" style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                <span className="muted" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>{roleTag(u, true)}{u.created_at && `desde ${br(u.created_at)}`}</span>
              </div>
              {delBtn(u, 44)}
            </div>
          ))}
        </div>
      )}
      {membros.length === 0 && (
        <p className="muted" style={{ margin: 0, fontSize: 15 }}>Você ainda não cadastrou ninguém. Use “Novo membro” para dar acesso à família.</p>
      )}

      <Modal open={!!mf} onClose={() => setMf(null)} width={480}>
        {mf && (
          <>
            <ModalHeader title="Novo membro" sub="Os membros veem e lançam nos mesmos dados da família." onClose={() => setMf(null)} />
            <form onSubmit={saveMember} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {merrs.form && (
                <div role="alert" style={{ display: "flex", gap: 10, padding: "12px 14px", border: "1px solid var(--color-neg)", background: "var(--color-neg-bg)", fontSize: 14 }}>
                  <Icon name="alert" size={18} /><span>{merrs.form}</span>
                </div>
              )}
              <div className="field">
                <label htmlFor="m-nome">Nome completo</label>
                <input id="m-nome" className="input" autoFocus placeholder="Ex.: Lia Souza" value={mf.nome} onChange={(e) => setM("nome", e.target.value)} aria-invalid={!!merrs.nome || undefined} />
                <FieldError msg={merrs.nome} />
              </div>
              <div className="field">
                <label htmlFor="m-email">E-mail</label>
                <input id="m-email" className="input" type="text" inputMode="email" placeholder="nome@email.com" value={mf.email} onChange={(e) => setM("email", e.target.value)} aria-invalid={!!merrs.email || undefined} />
                <FieldError msg={merrs.email} />
              </div>
              <div className="field">
                <label htmlFor="m-senha">Senha</label>
                <PasswordInput id="m-senha" autoComplete="new-password" placeholder="Mínimo de 6 caracteres" value={mf.senha} onChange={(v) => setM("senha", v)} invalid={!!merrs.senha} />
                <div style={{ marginTop: 6, fontSize: 13, color: merrs.senha ? "var(--color-neg)" : "var(--color-neutral-700)" }}>
                  {merrs.senha || "Mínimo de 6 caracteres. Passe a senha para a pessoa entrar."}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", paddingTop: 4 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMf(null)} style={{ minHeight: "var(--ctl-h)", padding: "0 18px", fontSize: 16 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary blueprint" disabled={saving} style={{ minHeight: "var(--ctl-h)", padding: "0 22px", fontSize: 16 }}>
                  {saving ? "Adicionando…" : "Adicionar membro"}<Corners />
                </button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
