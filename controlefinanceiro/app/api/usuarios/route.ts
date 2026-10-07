import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { authError } from "@/lib/api-errors";
import { getAuthUser } from "@/lib/auth-server";

// GET /api/usuarios — lista os membros da família criados por este admin
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas o administrador pode gerenciar usuários" },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });

  if (error) {
    return authError(error, "usuarios:listar", 500);
  }

  const usuarios = data.users
    .filter(
      (u) => u.user_metadata?.role === "membro" && u.user_metadata?.owner_id === auth.user.id
    )
    .map((u) => ({
      id: u.id,
      name: u.user_metadata?.name ?? "",
      email: u.email,
      created_at: u.created_at,
    }));

  return NextResponse.json({ usuarios });
}

// POST /api/usuarios — cria um novo membro da família, já com login e senha
// prontos (sem confirmação de e-mail, já que o admin define a senha).
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas o administrador pode criar usuários" },
      { status: 403 }
    );
  }

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

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role: "membro", owner_id: auth.user.id },
  });

  if (error) {
    return authError(error, "usuarios:criar");
  }

  return NextResponse.json(
    {
      usuario: {
        id: data.user.id,
        name,
        email: data.user.email,
        created_at: data.user.created_at,
      },
    },
    { status: 201 }
  );
}
