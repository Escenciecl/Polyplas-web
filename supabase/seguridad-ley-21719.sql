-- ============================================================================
-- Seguridad de la base de datos · Ley 21.719 (rige desde el 1-dic-2026)
-- ============================================================================
-- Antes: con la llave pública del sitio, cualquiera podía LEER y MODIFICAR todas las
-- conversaciones del chat (nombre, correo, teléfono) y cambiar stock y precios (pp_stock).
--
-- Después:
--   · Visitantes (llave pública): pueden CREAR conversaciones y mensajes (chat, cotizadores,
--     Webpay, transferencias) y leer SOLO su propia conversación, con chat_mensajes(id).
--   · Equipo (usuarios de Supabase que estén en la tabla public.equipo): leen y editan todo
--     desde el CRM.
--   · Servidor (Cloudflare, llave secreta SUPABASE_SERVICE_KEY): sin restricciones.
--
-- ORDEN PARA APLICARLO SIN ROMPER NADA
--   1. Publicar el CRM con inicio de sesión de Supabase (repositorio polyplas).
--   2. Publicar el sitio con el chat nuevo (este repositorio, rama seguridad-datos-y-cookies).
--   3. Confirmar que SUPABASE_SERVICE_KEY está en Cloudflare Pages (Webpay/transferencias).
--   4. Crear el usuario de la jefa en Supabase (Authentication → Add user) y agregarlo a equipo.
--   5. Recién ahí ejecutar este archivo.
-- ============================================================================

-- 1) Equipo autorizado ---------------------------------------------------------
create table if not exists public.equipo (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  nombre    text not null,
  creado_en timestamptz not null default now()
);
alter table public.equipo enable row level security;
-- Sin políticas: nadie la lee ni la cambia con la llave pública. Se administra desde Supabase.

create or replace function public.es_equipo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.equipo e where e.user_id = (select auth.uid()));
$$;
revoke all on function public.es_equipo() from public;
grant execute on function public.es_equipo() to anon, authenticated;

-- 2) Conversaciones ------------------------------------------------------------
drop policy if exists public_read_conversations   on public.conversations;
drop policy if exists public_update_conversations on public.conversations;
-- public_insert_conversations se mantiene: el sitio y el servidor crean conversaciones.

create policy "conversations: equipo lee"
  on public.conversations for select to authenticated
  using ((select public.es_equipo()));
create policy "conversations: equipo edita"
  on public.conversations for update to authenticated
  using ((select public.es_equipo())) with check ((select public.es_equipo()));
create policy "conversations: equipo elimina"
  on public.conversations for delete to authenticated
  using ((select public.es_equipo()));

-- 3) Mensajes ------------------------------------------------------------------
drop policy if exists public_read_messages   on public.messages;
drop policy if exists public_update_messages on public.messages;
-- public_insert_messages se mantiene.

create policy "messages: equipo lee"
  on public.messages for select to authenticated
  using ((select public.es_equipo()));
create policy "messages: equipo edita"
  on public.messages for update to authenticated
  using ((select public.es_equipo())) with check ((select public.es_equipo()));

-- 4) Stock y precios -------------------------------------------------------------
drop policy if exists "public write" on public.pp_stock;
-- "public read" se mantiene: los precios y el stock se muestran en el sitio.

create policy "pp_stock: equipo crea"
  on public.pp_stock for insert to authenticated
  with check ((select public.es_equipo()));
create policy "pp_stock: equipo edita"
  on public.pp_stock for update to authenticated
  using ((select public.es_equipo())) with check ((select public.es_equipo()));
create policy "pp_stock: equipo elimina"
  on public.pp_stock for delete to authenticated
  using ((select public.es_equipo()));

-- 5) Leads B2B: el equipo los ve y completa el seguimiento --------------------------
create policy "b2b_leads: equipo lee"
  on public.b2b_leads for select to authenticated
  using ((select public.es_equipo()));
create policy "b2b_leads: equipo edita"
  on public.b2b_leads for update to authenticated
  using ((select public.es_equipo())) with check ((select public.es_equipo()));

-- 6) Funciones del chat del sitio ---------------------------------------------------
-- El visitante conoce el id (UUID aleatorio) de SU conversación, guardado en su navegador.
-- Con ese id puede leer sus mensajes; sin él no puede listar ni leer otras conversaciones.
create or replace function public.chat_mensajes(p_conv uuid)
returns table (id uuid, sender text, content text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.sender, m.content, m.created_at
  from public.messages m
  where p_conv is not null and m.conversation_id = p_conv
  order by m.created_at
  limit 500;
$$;
revoke all on function public.chat_mensajes(uuid) from public;
grant execute on function public.chat_mensajes(uuid) to anon, authenticated;

-- Reemplaza los update que hacía el chat: solo toca la hora del último mensaje, el aviso de
-- "no leído" y el nombre (solo si todavía no tenía uno real).
create or replace function public.chat_actualizar(p_conv uuid, p_nombre text default null, p_no_leidos int default null)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.conversations c set
    last_message_at = now(),
    unread_count = case when p_no_leidos is not null then 1 else c.unread_count end,
    client_name = case
      when p_nombre is not null and length(trim(p_nombre)) > 0
           and (c.client_name is null or c.client_name in ('', 'Cliente Nuevo'))
      then left(trim(p_nombre), 120)
      else c.client_name end
  where c.id = p_conv;
$$;
revoke all on function public.chat_actualizar(uuid, text, int) from public;
grant execute on function public.chat_actualizar(uuid, text, int) to anon, authenticated;

-- 7) Agregar a la jefa al equipo (ejecutar DESPUÉS de crear su usuario en Supabase) ----
-- insert into public.equipo (user_id, nombre)
-- select id, 'Jefa' from auth.users where email = '<correo de la jefa>';
