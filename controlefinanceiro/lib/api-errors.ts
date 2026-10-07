import { NextResponse } from "next/server";

type SupabaseError = { message: string; code?: string; status?: number };

// Mensagens em português para os códigos de erro do Supabase Auth.
// https://supabase.com/docs/guides/auth/debugging/error-codes
const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos. Confira e tente de novo.",
  email_not_confirmed: "Seu e-mail ainda não foi confirmado. Abra o link que enviamos para sua caixa de entrada (veja também o spam) e tente de novo.",
  user_already_exists: "Já existe uma conta com esse e-mail.",
  email_exists: "Já existe uma conta com esse e-mail.",
  weak_password: "Senha fraca. Use pelo menos 6 caracteres, misturando letras e números.",
  email_address_invalid: "Esse e-mail não é aceito. Confira se está digitado certo.",
  over_email_send_rate_limit: "Muitos e-mails enviados em pouco tempo. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit: "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.",
  signup_disabled: "O cadastro de novas contas está desativado.",
};

/** Resposta de erro para falhas do Supabase Auth: registra no log da Vercel e traduz a mensagem. */
export function authError(error: SupabaseError, onde: string, status = 400) {
  console.error(`[auth:${onde}]`, error.code ?? "sem_codigo", error.message);
  const msg = (error.code && AUTH_MESSAGES[error.code]) || "Não foi possível concluir agora. Tente de novo em instantes.";
  return NextResponse.json({ error: msg, code: error.code }, { status });
}

/** Resposta de erro para falhas de banco: registra o erro real no log e devolve uma mensagem amigável. */
export function dbError(error: SupabaseError, onde: string) {
  console.error(`[db:${onde}]`, error.code ?? "sem_codigo", error.message);
  // Códigos do Postgres que o usuário consegue resolver sozinho.
  if (error.code === "23503") {
    return NextResponse.json({ error: "Esse item está sendo usado em outros lançamentos e não pode ser removido." }, { status: 409 });
  }
  if (error.code === "23505") {
    return NextResponse.json({ error: "Já existe um item com esses dados." }, { status: 409 });
  }
  return NextResponse.json(
    { error: "Não foi possível concluir a operação. Tente de novo em instantes." },
    { status: 500 }
  );
}
