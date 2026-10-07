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
    .from("transacoes")
    .select("*")
    .eq("user_id", getFamilyId(auth.user))
    .order("data_vencimento", { ascending: false });

  if (error) {
    return dbError(error, "transacoes:GET");
  }

  return NextResponse.json({ transacoes: data });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }

  const {
    descricao,
    valor,
    tipo,
    recorrencia,
    is_paid,
    data_vencimento,
    data_pagamento,
    categoria_id,
  } = await req.json();

  if (!descricao || valor == null || !tipo || !data_vencimento) {
    return NextResponse.json(
      { error: "Descrição, valor, tipo e data de vencimento são obrigatórios" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("transacoes")
    .insert({
      user_id: getFamilyId(auth.user),
      descricao,
      valor,
      tipo,
      recorrencia: recorrencia ?? "unica",
      is_paid: is_paid ?? false,
      data_vencimento,
      data_pagamento,
      categoria_id: categoria_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return dbError(error, "transacoes:POST");
  }

  return NextResponse.json({ transacao: data }, { status: 201 });
}
