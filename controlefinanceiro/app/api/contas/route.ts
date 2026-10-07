import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { dbError } from "@/lib/api-errors";
import { getAuthUser, getFamilyId } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("contas")
    .select("*")
    .eq("user_id", getFamilyId(auth.user))
    .order("created_at", { ascending: false });

  if (error) {
    return dbError(error, "contas:GET");
  }

  return NextResponse.json({ contas: data });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }

  const { nome, tipo, saldo_inicial, cor } = await req.json();

  if (!nome || !tipo) {
    return NextResponse.json(
      { error: "Nome e tipo são obrigatórios" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("contas")
    .insert({
      user_id: getFamilyId(auth.user),
      nome,
      tipo,
      saldo_inicial: saldo_inicial ?? 0,
      cor,
    })
    .select()
    .single();

  if (error) {
    return dbError(error, "contas:POST");
  }

  return NextResponse.json({ conta: data }, { status: 201 });
}
