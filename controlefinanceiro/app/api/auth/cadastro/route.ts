import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase-server";
import { authError } from "@/lib/api-errors";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Nome, e-mail e senha são obrigatórios" },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "A senha deve ter pelo menos 6 caracteres" },
      { status: 400 }
    );
  }

  // Quem se cadastra publicamente vira o "admin" da própria família —
  // membros só são criados depois, pelo admin, em /dashboard/usuarios.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role: "admin" },
    },
  });

  if (error) {
    return authError(error, "cadastro");
  }

  // Com confirmação de e-mail ligada, o Supabase não acusa e-mail repetido:
  // devolve um usuário "falso" sem identidades, e nenhum e-mail é enviado.
  if (data.user && data.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "Já existe uma conta com esse e-mail. Faça login ou confirme o e-mail que enviamos.", code: "user_already_exists" },
      { status: 409 }
    );
  }

  return NextResponse.json(
    {
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name,
        role: "admin",
      },
      session: data.session,
    },
    { status: 201 }
  );
}
