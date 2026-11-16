-- ============================================================================
-- Ley 21.719 · Consentimiento para ofertas (punto 1) y solicitudes de derechos (punto 4)
-- Solo AGREGA dos tablas nuevas. No toca ningún dato existente.
-- Las escribe el servidor (Cloudflare, llave secreta). La llave pública del sitio no puede
-- leerlas ni escribirlas. El equipo (tabla equipo) las revisa y actualiza desde Supabase/CRM.
-- Pegar completo en Supabase (proyecto "polyplas chat") → SQL Editor → Run.
-- ============================================================================

-- 1) Consentimientos para recibir ofertas por correo (prueba de cada "sí")
create table if not exists public.consentimientos_ofertas (
  id          bigint generated always as identity primary key,
  creado_en   timestamptz not null default now(),
  email       text not null check (char_length(email) between 5 and 160),
  nombre      text check (char_length(nombre) <= 120),
  origen      text not null check (origen in ('checkout', 'cuenta', 'b2b_pop', 'b2b_letreros', 'b2b_mayor')),
  texto       text not null,          -- texto exacto que la persona aceptó
  version     smallint not null,
  pagina      text check (char_length(pagina) <= 200),
  retirado_en timestamptz             -- se completa si la persona se da de baja
);
create index if not exists consentimientos_ofertas_email_idx on public.consentimientos_ofertas (lower(email));
alter table public.consentimientos_ofertas enable row level security;
create policy "consentimientos_ofertas: equipo lee"
  on public.consentimientos_ofertas for select to authenticated using ((select public.es_equipo()));
create policy "consentimientos_ofertas: equipo edita"
  on public.consentimientos_ofertas for update to authenticated
  using ((select public.es_equipo())) with check ((select public.es_equipo()));

-- 2) Solicitudes de derechos (acceso, rectificación, supresión, oposición, portabilidad, bloqueo)
create table if not exists public.solicitudes_derechos (
  id               bigint generated always as identity primary key,
  folio            text not null unique check (folio ~ '^DER-[A-Z0-9]{6}$'),
  recibida_en      timestamptz not null default now(),
  nombre           text not null check (char_length(nombre) between 1 and 120),
  email            text not null check (char_length(email) between 5 and 160),
  rut              text check (char_length(rut) <= 20),
  telefono         text check (char_length(telefono) <= 30),
  derecho          text not null check (derecho in ('acceso','rectificacion','supresion','oposicion','portabilidad','bloqueo','otro')),
  detalle          text check (char_length(detalle) <= 2000),
  plazo_respuesta  date not null,     -- 30 días corridos desde la recepción
  estado           text not null default 'recibida' check (estado in ('recibida','identidad_pendiente','en_proceso','respondida','rechazada')),
  identidad_verificada boolean,
  respondida_en    timestamptz,
  respuesta        text,              -- resumen de lo que se respondió
  responsable      text               -- quién la atendió
);
alter table public.solicitudes_derechos enable row level security;
create policy "solicitudes_derechos: equipo lee"
  on public.solicitudes_derechos for select to authenticated using ((select public.es_equipo()));
create policy "solicitudes_derechos: equipo edita"
  on public.solicitudes_derechos for update to authenticated
  using ((select public.es_equipo())) with check ((select public.es_equipo()));

-- 3) Leads B2B: guardar si la empresa aceptó recibir ofertas (la casilla parte desmarcada)
alter table public.b2b_leads add column if not exists acepta_ofertas boolean not null default false;

-- Comprobación: ambas en 0
select (select count(*) from public.consentimientos_ofertas) as consentimientos,
       (select count(*) from public.solicitudes_derechos) as solicitudes;
