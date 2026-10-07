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
    .from("categorias")
    .select("*")
    .eq("user_id", getFamilyId(auth.user))
    .order("nome", { ascending: true });

  if (error) {
    return dbError(error, "categorias:GET");
  }

  return NextResponse.json({ categorias: data });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 });
  }

  const { nome, cor } = await req.json();

  if (!nome) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("categorias")
    .insert({
      user_id: getFamilyId(auth.user),
      nome,
      cor,
    })
    .select()
    .single();

  if (error) {
    return dbError(error, "categorias:POST");
  }

  return NextResponse.json({ categoria: data }, { status: 201 });
}
