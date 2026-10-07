"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { emailOk } from "@/lib/format";
import { AuthShell } from "@/components/auth-shell";
import { CheckRow, Corners, FieldError, PasswordInput } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lembrar, setLembrar] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<{ email?: string; senha?: string; form?: string }>({});
  const [info, setInfo] = useState<React.ReactNode>();

  // Vindo do cadastro com confirmação de e-mail pendente (?confirmar=email).
  useEffect(() => {
    const pendente = new URLSearchParams(window.location.search).get("confirmar");
    if (!pendente) return;
    setEmail(pendente);
    setInfo(<>Conta criada! Enviamos um link de confirmação para <strong>{pendente}</strong>. Abra o e-mail (veja também o spam), clique no link e depois entre aqui.</>);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n: typeof errs = {};
    if (!emailOk(email)) n.email = "Digite um e-mail válido.";
    if (!password) n.senha = "Digite sua senha.";
    if (Object.keys(n).length) { setErrs(n); return; }
    setBusy(true);
    setErrs({});
    try {
      const res = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) });
      const data = await res.json();
      if (!res.ok) {
        setErrs({ form: data.error || "Não foi possível entrar agora. Tente de novo em instantes." });
        return;
      }
      localStorage.setItem("token", data.session.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/dashboard");
    } catch {
      setErrs({ form: "Erro ao conectar com o servidor." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell error={errs.form} info={info}>
      <div>
        <h1 style={{ fontSize: 44, margin: "0 0 6px" }}>Entrar</h1>
        <p className="muted" style={{ margin: 0 }}>Acesse as finanças da sua família.</p>
      </div>
      <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="field">
          <label htmlFor="l-email">E-mail</label>
          <input id="l-email" className="input" type="text" inputMode="email" autoComplete="email" placeholder="voce@email.com" value={email}
            onChange={(e) => { setEmail(e.target.value); setErrs((x) => ({ ...x, email: undefined, form: undefined })); }} aria-invalid={!!errs.email || undefined} />
          <FieldError msg={errs.email} />
        </div>
        <div className="field">
          <label htmlFor="l-senha">Senha</label>
          <PasswordInput id="l-senha" autoComplete="current-password" placeholder="Sua senha" value={password}
            onChange={(v) => { setPassword(v); setErrs((x) => ({ ...x, senha: undefined, form: undefined })); }} invalid={!!errs.senha} />
          <FieldError msg={errs.senha} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", minHeight: "var(--ctl-h)" }}>
          {/* TODO: "Lembrar de mim" ainda não muda nada — a sessão sempre fica salva no navegador. */}
          <CheckRow checked={lembrar} onChange={setLembrar}>Lembrar de mim</CheckRow>
          <a href="#" onClick={(e) => { e.preventDefault(); setErrs({ form: "A recuperação de senha ainda não está disponível. Fale com o administrador da família." }); }} style={{ fontSize: 14 }}>
            Esqueceu a senha?
          </a>
        </div>
        <button type="submit" className="btn btn-primary blueprint" disabled={busy} style={{ width: "100%", minHeight: 48, fontSize: 18 }}>
          {busy ? "Entrando…" : "Entrar"}<Corners />
        </button>
      </form>
      <p className="muted" style={{ margin: 0, textAlign: "center", fontSize: 15 }}>
        Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
      </p>
    </AuthShell>
  );
}
