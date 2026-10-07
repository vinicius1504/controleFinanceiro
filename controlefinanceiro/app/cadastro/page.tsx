"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { emailOk } from "@/lib/format";
import { AuthShell } from "@/components/auth-shell";
import { Corners, FieldError, PasswordInput } from "@/components/ui";

type Errs = { nome?: string; email?: string; senha?: string; senha2?: string; form?: string };

export default function Cadastro() {
  const router = useRouter();
  const [f, setF] = useState({ nome: "", email: "", senha: "", senha2: "" });
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<Errs>({});

  const set = (k: keyof typeof f, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    setErrs((x) => ({ ...x, [k]: undefined, form: undefined }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n: Errs = {};
    if (!f.nome.trim()) n.nome = "Informe seu nome.";
    if (!emailOk(f.email)) n.email = "Digite um e-mail válido.";
    if (f.senha.length < 6) n.senha = "A senha precisa ter pelo menos 6 caracteres.";
    if (!n.senha && f.senha !== f.senha2) n.senha2 = "As senhas não são iguais.";
    if (Object.keys(n).length) { setErrs(n); return; }
    setBusy(true);
    try {
      const res = await apiFetch("/api/auth/cadastro", { method: "POST", body: JSON.stringify({ name: f.nome.trim(), email: f.email.trim(), password: f.senha }) });
      const data = await res.json();
      if (!res.ok) { setErrs({ form: data.error || "Não foi possível criar a conta." }); return; }
      if (data.session?.access_token) {
        localStorage.setItem("token", data.session.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        // Projeto com confirmação de e-mail ligada: não há sessão até confirmar.
        router.push("/login");
      }
    } catch {
      setErrs({ form: "Erro ao conectar com o servidor." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell error={errs.form}>
      <div>
        <h1 style={{ fontSize: 44, margin: "0 0 6px" }}>Criar conta</h1>
        <p className="muted" style={{ margin: 0 }}>Você será o administrador da família e poderá cadastrar os outros membros depois.</p>
      </div>
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label htmlFor="c-nome">Nome</label>
          <input id="c-nome" className="input" autoComplete="name" placeholder="Seu nome completo" value={f.nome} onChange={(e) => set("nome", e.target.value)} aria-invalid={!!errs.nome || undefined} />
          <FieldError msg={errs.nome} />
        </div>
        <div className="field">
          <label htmlFor="c-email">E-mail</label>
          <input id="c-email" className="input" type="text" inputMode="email" autoComplete="email" placeholder="voce@email.com" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!errs.email || undefined} />
          <FieldError msg={errs.email} />
        </div>
        <div className="field">
          <label htmlFor="c-senha">Senha</label>
          <PasswordInput id="c-senha" autoComplete="new-password" placeholder="Mínimo de 6 caracteres" value={f.senha} onChange={(v) => set("senha", v)} invalid={!!errs.senha} />
          <FieldError msg={errs.senha} />
        </div>
        <div className="field">
          <label htmlFor="c-senha2">Confirmar senha</label>
          <input id="c-senha2" className="input" type="password" autoComplete="new-password" placeholder="Repita a senha" value={f.senha2} onChange={(e) => set("senha2", e.target.value)} aria-invalid={!!errs.senha2 || undefined} />
          <FieldError msg={errs.senha2} />
        </div>
        <button type="submit" className="btn btn-primary blueprint" disabled={busy} style={{ width: "100%", minHeight: 48, fontSize: 18, marginTop: 4 }}>
          {busy ? "Criando conta…" : "Criar conta"}<Corners />
        </button>
      </form>
      <p className="muted" style={{ margin: 0, textAlign: "center", fontSize: 15 }}>
        Já tem conta? <Link href="/login">Voltar para o login</Link>
      </p>
    </AuthShell>
  );
}
