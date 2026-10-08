-- Polyplas: cuentas de clientes y sus compras.
-- Ejecutar UNA vez en Supabase → SQL Editor. Se puede volver a ejecutar sin romper nada.
--
-- Los usuarios y sus contraseñas (cifradas) los maneja Supabase Auth en auth.users.
-- Aquí solo se crean las tablas públicas con los datos del cliente y sus compras.

-- 1) Clientes: una fila por cada cuenta creada (Google o correo + contraseña)
create table if not exists public.clientes (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  nombre     text,
  telefono   text,
  proveedor  text,                       -- 'google' o 'email'
  creado_en  timestamptz not null default now()
);

alter table public.clientes enable row level security;

drop policy if exists "clientes: ver el propio" on public.clientes;
create policy "clientes: ver el propio" on public.clientes
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "clientes: editar el propio" on public.clientes;
create policy "clientes: editar el propio" on public.clientes
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- El cliente solo puede cambiar su nombre y teléfono
revoke all on public.clientes from anon, authenticated;
grant select on public.clientes to authenticated;
grant update (nombre, telefono) on public.clientes to authenticated;

-- Al crearse una cuenta, se registra sola en "clientes"
create or replace function public.pp_registrar_cliente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.clientes (id, email, nombre, proveedor)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'nombre',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.pp_registrar_cliente() from public, anon, authenticated;

drop trigger if exists pp_al_crear_usuario on auth.users;
create trigger pp_al_crear_usuario
  after insert on auth.users
  for each row execute function public.pp_registrar_cliente();

-- 2) Compras: una fila por cada pago aprobado en Webpay hecho con la sesión iniciada.
--    Solo el servidor (Cloudflare, con la llave secreta) puede escribir aquí;
--    cada cliente solo puede LEER las suyas.
create table if not exists public.compras (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users (id) on delete set null,
  orden        text not null unique,     -- orden de compra Webpay (PP-XXXXXXXX)
  total        integer not null,
  entrega      text,
  items        jsonb not null default '[]'::jsonb,
  cliente      jsonb not null default '{}'::jsonb,   -- datos de facturación y despacho usados
  webpay_auth  text,
  estado       text not null default 'pagado',
  creado_en    timestamptz not null default now()
);

create index if not exists compras_user_id_idx on public.compras (user_id, creado_en desc);

alter table public.compras enable row level security;

drop policy if exists "compras: ver las propias" on public.compras;
create policy "compras: ver las propias" on public.compras
  for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.compras from anon, authenticated;
grant select on public.compras to authenticated;
