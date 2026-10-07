import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { authError } from "@/lib/api-errors";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-mail e senha são obrigatórios" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // 403 para e-mail não confirmado: a senha está certa, só falta confirmar.
    const status = error.code === "email_not_confirmed" ? 403 : error.code === "invalid_credentials" ? 401 : 400;
    return authError(error, "login", status);
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
      role: data.user.user_metadata?.role === "membro" ? "membro" : "admin",
    },
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  });
}
