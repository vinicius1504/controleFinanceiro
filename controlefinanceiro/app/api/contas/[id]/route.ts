import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { dbError } from "@/lib/api-errors";
import { getAuthUser, getFamilyId } from "@/lib/auth-server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }

  const { id } = await params;
  const { nome, tipo, saldo_inicial, cor } = await req.json();

  const { data, error } = await supabaseAdmin
    .from("contas")
    .update({
      nome,
      tipo,
      saldo_inicial,
      cor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", getFamilyId(auth.user))
    .select()
    .single();

  if (error) {
    return dbError(error, "contas:id:PUT");
  }

  if (!data) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ conta: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }

  const { id } = await params;

  const { error, count } = await supabaseAdmin
    .from("contas")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", getFamilyId(auth.user));

  if (error) {
    return dbError(error, "contas:id:DELETE");
  }

  if (!count) {
    return NextResponse.json({ error: "Conta não encontrada" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
