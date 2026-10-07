-- Esquema inicial do Controle Financeiro, reconstruído a partir das rotas em app/api/**.
-- user_id guarda o id da FAMÍLIA (id do admin; ver getFamilyId em lib/auth-server.ts),
-- não necessariamente o do usuário logado.

create table public.contas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo text not null,
  saldo_inicial numeric(12, 2) not null default 0,
  cor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  cor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  descricao text not null,
  valor numeric(12, 2) not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  recorrencia text not null default 'unica'
    check (recorrencia in ('unica', 'semanal', 'mensal', 'anual')),
  is_paid boolean not null default false,
  data_vencimento date not null,
  data_pagamento date,
  categoria_id uuid references public.categorias (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on public.contas (user_id);
create index on public.categorias (user_id);
create index on public.transacoes (user_id, data_vencimento);

-- O app acessa tudo pelo service role (que ignora RLS) e filtra user_id na aplicação.
-- RLS ligado sem policies bloqueia acesso direto com a anon key.
alter table public.contas enable row level security;
alter table public.categorias enable row level security;
alter table public.transacoes enable row level security;
