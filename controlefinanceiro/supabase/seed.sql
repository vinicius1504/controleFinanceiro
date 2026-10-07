-- Estado inicial do ambiente local (rodado em `supabase start` / `supabase db reset`):
-- um admin para entrar e as categorias básicas da família dele. Sem lançamentos e sem membros.
-- Login: admin@teste.com / 123456

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'admin@teste.com', crypt('123456', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin","role":"admin"}', now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
values (
  gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"admin@teste.com","email_verified":true}',
  'email', now(), now(), now()
);

-- Categorias básicas (cores da paleta do design system).
insert into public.categorias (user_id, nome, cor)
select '11111111-1111-1111-1111-111111111111', nome, cor
from (values
  -- Despesas
  ('Moradia',           '#4f7cac'),
  ('Contas da casa',    '#3f9a8f'),
  ('Alimentação',       '#d0803a'),
  ('Transporte',        '#8a5fb8'),
  ('Saúde',             '#c4566a'),
  ('Educação',          '#5d6bc4'),
  ('Lazer',             '#c49a2c'),
  ('Cartão de crédito', '#6b7a86'),
  ('Assinaturas',       '#b05f9a'),
  ('Impostos e taxas',  '#b34848'),
  ('Outros',            '#8a6d5a'),
  -- Receitas
  ('Salário',           '#5b9a4a'),
  ('Renda extra',       '#2a7350'),
  ('Investimentos',     '#416180')
) as c(nome, cor);
