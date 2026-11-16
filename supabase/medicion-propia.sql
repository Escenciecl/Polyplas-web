-- ============================================================================
-- Medición propia sin cookies (Ley 21.719) · solo AGREGA, no toca ningún dato existente
--  1) b2b_leads.atribucion: campaña que trajo cada lead B2B (pedidos y cotizaciones la
--     guardan en conversations.metadata.atribucion, que ya existe como jsonb).
--  2) funnel_diario: contadores agregados por día, canal, campaña, línea y paso del funnel.
--     No guarda IP, correo, nombre ni ningún identificador: solo totales.
--     Lo escribe solo el servidor (Cloudflare, llave secreta) mediante funnel_sumar().
-- ============================================================================

alter table public.b2b_leads add column if not exists atribucion jsonb;

create table if not exists public.funnel_diario (
  dia      date    not null,
  canal    text    not null check (char_length(canal) <= 40),
  campana  text    not null default '' check (char_length(campana) <= 80),
  linea    text    not null default '' check (char_length(linea) <= 60),
  paso     text    not null check (char_length(paso) <= 40),
  sesiones integer not null default 0,   -- sesiones que llegaron a este paso (1 por sesión)
  eventos  integer not null default 0,   -- veces que ocurrió (ej. 3 productos agregados)
  valor    bigint  not null default 0,   -- suma en CLP (solo compras y pagos iniciados)
  primary key (dia, canal, campana, linea, paso)
);
alter table public.funnel_diario enable row level security;
create policy "funnel_diario: equipo lee"
  on public.funnel_diario for select to authenticated using ((select public.es_equipo()));

create or replace function public.funnel_sumar(p_filas jsonb)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.funnel_diario as f (dia, canal, campana, linea, paso, sesiones, eventos, valor)
  select (now() at time zone 'America/Santiago')::date, canal, campana, linea, paso,
         least(sum(sesiones), 1), least(sum(eventos), 50), least(sum(valor), 100000000)
  from (
    select left(coalesce(x->>'canal', 'directo'), 40) as canal,
           left(coalesce(x->>'campana', ''), 80) as campana,
           left(coalesce(x->>'linea', ''), 60) as linea,
           left(x->>'paso', 40) as paso,
           least(greatest(coalesce((x->>'sesiones')::int, 0), 0), 1) as sesiones,
           least(greatest(coalesce((x->>'eventos')::int, 0), 0), 50) as eventos,
           least(greatest(coalesce((x->>'valor')::bigint, 0), 0), 100000000) as valor
    from jsonb_array_elements(p_filas) x
    where x->>'paso' is not null
  ) s
  group by canal, campana, linea, paso   -- agrupa filas repetidas de un mismo envío
  on conflict (dia, canal, campana, linea, paso) do update set
    sesiones = f.sesiones + excluded.sesiones,
    eventos  = f.eventos  + excluded.eventos,
    valor    = f.valor    + excluded.valor;
$$;
revoke all on function public.funnel_sumar(jsonb) from public, anon, authenticated;

-- Vista de ventas y pedidos por campaña (para el equipo; respeta los permisos de conversations)
create or replace view public.ventas_por_campana with (security_invoker = true) as
select date_trunc('day', c.created_at at time zone 'America/Santiago')::date as dia,
       c.metadata->>'source'                                  as tipo,
       coalesce(c.metadata->'atribucion'->>'canal', 'sin dato') as canal,
       coalesce(c.metadata->'atribucion'->>'campana', '')      as campana,
       count(*)                                                as cantidad,
       sum(case when (c.metadata->>'total') ~ '^[0-9]+(\.[0-9]+)?$'
                then (c.metadata->>'total')::numeric else 0 end) as monto
from public.conversations c
where c.metadata ? 'atribucion'
group by 1, 2, 3, 4;

select 'ok' as listo;
