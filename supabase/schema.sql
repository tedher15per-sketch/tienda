-- =====================================================================
--  Mostrador Abarrotes · esquema de Supabase
--  Pégalo completo en Supabase → SQL Editor → Run. Se puede correr de nuevo sin romper nada.
--
--  Modelo: una tabla `docs` tipo documento (collection, id, data jsonb).
--  Colecciones: products, sales, orders, purchases, fiados, staff, requests, config
--  Roles (en staff/<uid>.role): admin | cajero | almacen. Cualquiera sin registro en staff es "cliente".
--  La PRIMERA cuenta que se registre queda como dueño (admin) automáticamente.
-- =====================================================================

create table if not exists public.docs (
  collection  text        not null,
  id          text        not null,
  data        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (collection, id)
);
alter table public.docs replica identity full;           -- para que Realtime avise también de borrados
create index if not exists docs_at_idx       on public.docs (collection, ((data->>'at')));
create index if not exists docs_customer_idx on public.docs (collection, (data->>'customer'));
create index if not exists docs_barcode_idx  on public.docs (collection, (data->>'barcode'));

-- ---------- roles ----------
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select data->>'role' from public.docs where collection = 'staff' and id = auth.uid()::text),
    'cliente')
$$;
create or replace function public.is_staff() returns boolean language sql stable set search_path = public as $$
  select public.app_role() in ('admin','cajero','almacen') $$;
create or replace function public.is_admin() returns boolean language sql stable set search_path = public as $$
  select public.app_role() = 'admin' $$;

-- Quién puede escribir qué (insert / update / delete)
create or replace function public.can_write(c text, i text, d jsonb) returns boolean
language sql stable set search_path = public as $$
  select case c
    when 'products'  then public.is_staff()                                   -- el cajero descuenta existencias al vender
    when 'sales'     then public.is_staff()
    when 'fiados'    then public.is_staff()
    when 'purchases' then public.app_role() in ('admin','almacen')
    when 'config'    then public.is_admin()
    when 'staff'     then public.is_admin()
    when 'requests'  then public.is_admin()
                       or (auth.uid() is not null and i = auth.uid()::text and d->>'role' in ('cajero','almacen'))
    when 'orders'    then public.is_staff()
                       or (auth.uid() is not null and d->>'customer' = auth.uid()::text and d->>'status' in ('nuevo','cancelado'))
    else false
  end
$$;

alter table public.docs enable row level security;

drop policy if exists docs_select on public.docs;
create policy docs_select on public.docs for select using (
  case collection
    when 'products'  then true                                  -- el catálogo es público
    when 'config'    then true
    when 'orders'    then public.is_staff() or data->>'customer' = auth.uid()::text
    when 'staff'     then public.is_admin() or id = auth.uid()::text
    when 'requests'  then public.is_admin() or id = auth.uid()::text
    when 'sales'     then public.is_staff()
    when 'fiados'    then public.is_staff()
    when 'purchases' then public.app_role() in ('admin','almacen')
    else false
  end);

drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert with check (public.can_write(collection, id, data));
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update
  using (public.can_write(collection, id, data)) with check (public.can_write(collection, id, data));
drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete using (public.can_write(collection, id, data));

-- Fusión de campos del lado del servidor (respeta las mismas políticas)
create or replace function public.doc_merge(p_collection text, p_id text, p_patch jsonb) returns boolean
language plpgsql security invoker set search_path = public as $$
declare n int;
begin
  update public.docs set data = data || p_patch, updated_at = now()
   where collection = p_collection and id = p_id;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Suma/resta atómica de existencias (dos cajas vendiendo a la vez no se pisan)
create or replace function public.stock_add(p_id text, p_delta numeric, p_entry jsonb) returns boolean
language plpgsql security invoker set search_path = public as $$
declare n int;
begin
  update public.docs set
    data = data || jsonb_build_object(
      'stock', round(coalesce((data->>'stock')::numeric, 0) + p_delta, 3),
      'log', jsonb_path_query_array(jsonb_build_array(p_entry) || coalesce(data->'log', '[]'::jsonb), '$[0 to 24]'),
      'updatedAt', (extract(epoch from now())*1000)::bigint),
    updated_at = now()
  where collection = 'products' and id = p_id;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- ---------- la primera cuenta registrada es el dueño ----------
create or replace function public.bootstrap_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.docs where collection = 'staff' and data->>'role' = 'admin') then
    insert into public.docs (collection, id, data) values (
      'staff', new.id::text,
      jsonb_build_object('role','admin',
                         'label', coalesce(nullif(new.raw_user_meta_data->>'name',''), new.email),
                         'at', (extract(epoch from now())*1000)::bigint));
  end if;
  return new;
end $$;
-- solo el trigger la usa; nadie la llama por la API
revoke execute on function public.bootstrap_owner() from public, anon, authenticated;
-- app_role() sí debe ser ejecutable: las políticas la llaman con el rol de quien consulta (solo revela tu propio puesto)
drop trigger if exists on_auth_user_created_owner on auth.users;
create trigger on_auth_user_created_owner after insert on auth.users
  for each row execute function public.bootstrap_owner();

-- ---------- tiempo real ----------
do $$ begin
  alter publication supabase_realtime add table public.docs;
exception when duplicate_object then null; end $$;

-- ---------- fotos de productos ----------
insert into storage.buckets (id, name, public) values ('productos', 'productos', true)
  on conflict (id) do nothing;
drop policy if exists "fotos_productos_leer" on storage.objects;
create policy "fotos_productos_leer" on storage.objects for select using (bucket_id = 'productos');
drop policy if exists "fotos_productos_subir" on storage.objects;
create policy "fotos_productos_subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.app_role() in ('admin','almacen'));
