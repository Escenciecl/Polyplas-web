-- PASO 4 · Registro anónimo de decisiones de cookies (Ley 21.719)
-- Solo AGREGA una tabla nueva. No toca ningún dato existente.
-- Sirve para demostrar que cada consentimiento se pidió y se dio, y para contar cuántos
-- aceptan o rechazan. NO guarda IP, nombre ni correo: solo un código aleatorio por navegador.
-- Pegar completo en Supabase (proyecto "polyplas chat") → SQL Editor → Run.

create table if not exists public.consentimientos (
  id                bigint generated always as identity primary key,
  creado_en         timestamptz not null default now(),
  consentimiento_id uuid not null,
  version           smallint not null check (version between 1 and 100),
  analiticas        boolean not null,
  publicidad        boolean not null,
  origen            text not null check (origen in ('aceptar_todo', 'rechazar_todo', 'configurar')),
  pagina            text check (char_length(pagina) <= 200)
);
create index if not exists consentimientos_id_idx on public.consentimientos (consentimiento_id);
create index if not exists consentimientos_fecha_idx on public.consentimientos (creado_en);

alter table public.consentimientos enable row level security;

-- El sitio solo puede AGREGAR registros (no leerlos, cambiarlos ni borrarlos)
create policy "consentimientos: el sitio registra"
  on public.consentimientos for insert to anon, authenticated
  with check (true);

-- El equipo los puede revisar
create policy "consentimientos: equipo lee"
  on public.consentimientos for select to authenticated
  using ((select public.es_equipo()));

-- Comprobación (debe mostrar 0 al principio)
select count(*) as registros from public.consentimientos;
