import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { authError } from "@/lib/api-errors";
import { getAuthUser } from "@/lib/auth-server";

// DELETE /api/usuarios/:id — remove um membro da família (só o admin dono
// desse membro pode remover)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas o administrador pode remover usuários" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const { data: target, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(id);

  if (fetchError || !target.user || target.user.user_metadata?.owner_id !== auth.user.id) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

  if (error) {
    return authError(error, "usuarios:excluir", 500);
  }

  return new NextResponse(null, { status: 204 });
}
