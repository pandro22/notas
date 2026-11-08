-- Tabla de notas: cada nota pertenece a un usuario
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

-- VULNERABILIDAD DELIBERADA (para auditar despues):
-- RLS NO esta activado, asi que cualquier usuario puede leer/borrar las notas de todos.
-- alter table public.notes enable row level security;
