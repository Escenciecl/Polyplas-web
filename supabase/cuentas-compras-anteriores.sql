-- Polyplas: compras anteriores en la cuenta del cliente.
-- Ejecutar en Supabase → SQL Editor. Se puede volver a ejecutar sin romper nada.
--
-- Cuando un cliente entra a "Mi cuenta", se suman a su cuenta las compras web que hizo
-- como invitado con el MISMO correo:
--   • pagos Webpay (vista pedidos_web, una fila por orden)
--   • transferencias ya pagadas (estado_pago = 'pagado')
--
-- Seguridad:
--   • Solo con el correo CONFIRMADO (el cliente demostró que el correo es suyo).
--   • Solo trae compras del correo de quien llama (auth.uid()); nadie puede pedir las de otro.
--   • Una orden que ya está en otra cuenta no se mueve (on conflict do nothing).
--   • No borra ni cambia nada en el CRM: solo copia a la tabla "compras".

create or replace function public.pp_vincular_mis_compras()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_n     integer := 0;
begin
  if v_uid is null then
    return 0;
  end if;

  select lower(trim(u.email)) into v_email
  from auth.users u
  where u.id = v_uid and u.email_confirmed_at is not null;

  if coalesce(v_email, '') = '' then
    return 0;
  end if;

  insert into public.compras (user_id, orden, total, entrega, items, cliente, webpay_auth, estado, creado_en)
  select v_uid, x.orden, x.total, x.entrega, x.items, cl.cliente, x.auth, 'pagado', x.creado_en
  from (
    -- Webpay
    select p.webpay_orden as orden,
           coalesce(nullif(regexp_replace(coalesce(p.metadata ->> 'total', ''), '\D', '', 'g'), '')::integer, 0) as total,
           p.metadata ->> 'entrega' as entrega,
           case when jsonb_typeof(p.metadata -> 'items') = 'array' then p.metadata -> 'items' else '[]'::jsonb end as items,
           p.metadata as m,
           p.metadata ->> 'webpay_auth' as auth,
           p.creado_en
    from public.pedidos_web p
    where lower(trim(p.metadata ->> 'email')) = v_email
    union all
    -- Transferencias pagadas
    select c.metadata ->> 'transferencia_orden',
           coalesce(nullif(regexp_replace(coalesce(c.metadata ->> 'total', ''), '\D', '', 'g'), '')::integer, 0),
           c.metadata ->> 'entrega',
           case when jsonb_typeof(c.metadata -> 'items') = 'array' then c.metadata -> 'items' else '[]'::jsonb end,
           c.metadata,
           null,
           c.created_at
    from public.conversations c
    where c.metadata ->> 'source' = 'transferencia'
      and c.metadata ->> 'estado_pago' = 'pagado'
      and coalesce(c.metadata ->> 'transferencia_orden', '') <> ''
      and lower(trim(c.metadata ->> 'email')) = v_email
  ) x(orden, total, entrega, items, m, auth, creado_en)
  -- mismos nombres de campo que guarda el pago con sesión (order.client)
  cross join lateral (
    select jsonb_strip_nulls(jsonb_build_object(
      'tipo', x.m ->> 'tipo_cliente', 'nombre', x.m ->> 'nombre', 'razon', x.m ->> 'razon_social',
      'rut', x.m ->> 'rut', 'giro', x.m ->> 'giro', 'email', x.m ->> 'email', 'tel', x.m ->> 'phone',
      'dir', x.m ->> 'dir', 'ciudad', x.m ->> 'ciudad', 'region', x.m ->> 'region',
      'dir_factura', x.m ->> 'dir_factura', 'ciudad_factura', x.m ->> 'ciudad_factura', 'region_factura', x.m ->> 'region_factura'
    )) as cliente
  ) cl
  where coalesce(x.orden, '') <> ''
  on conflict (orden) do nothing;

  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

revoke execute on function public.pp_vincular_mis_compras() from public, anon;
grant execute on function public.pp_vincular_mis_compras() to authenticated;
