-- ════════════════════════════════════════════════════════════════════════════
-- Menú digital multi-tenant — esquema inicial
--
-- Modelo de seguridad (resumen; detalle en docs/SEGURIDAD.md):
--   • Cada fila de negocio lleva restaurant_id y RLS la limita a los miembros
--     de ese restaurante. Las tablas hijas usan claves foráneas compuestas
--     (id, restaurant_id) para que nunca se pueda enlazar algo de otro tenant.
--   • El público (anon) NO tiene acceso a ninguna tabla. Lee el menú solo con
--     get_public_menu(slug) y crea pedidos solo con place_order(...), que
--     recalcula precios y valida todo en el servidor.
--   • Plan, estado y prueba del restaurante solo los cambia la plataforma
--     (super admin) mediante funciones que dejan registro en auditoría.
--   • Las membresías no se pueden insertar desde el cliente: solo las crea
--     create_restaurant() (dueño) y, más adelante, invitaciones controladas.
-- ════════════════════════════════════════════════════════════════════════════

create schema if not exists private;
revoke all on schema private from public;
-- Las políticas RLS llaman funciones de este esquema con los permisos de quien consulta.
grant usage on schema private to authenticated;

-- ───────────────────────── Plataforma ─────────────────────────

-- Super admins de la plataforma. Vive en "private": no se expone por la API.
create table if not exists private.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists private.audit_log (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  actor_id      uuid,
  action        text not null,
  restaurant_id uuid,
  details       jsonb not null default '{}'::jsonb
);
create index if not exists audit_log_restaurant_idx on private.audit_log(restaurant_id, at desc);

-- ───────────────────────── Tenants ─────────────────────────

create table if not exists public.restaurants (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null check (char_length(btrim(name)) between 2 and 80),
  tagline       text check (char_length(tagline) <= 140),
  description   text check (char_length(description) <= 600),
  logo_path     text,
  cover_path    text,
  brand_color   text not null default '#F5A01E' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  whatsapp      text check (whatsapp ~ '^[0-9]{8,15}$'),
  address       text check (char_length(address) <= 200),
  hours         text check (char_length(hours) <= 200),
  currency      text not null default 'DOP' check (currency in ('DOP', 'USD')),
  is_published  boolean not null default true,
  -- Controlado solo por la plataforma (sin permiso de UPDATE para los dueños):
  status        text not null default 'trial' check (status in ('trial', 'active', 'suspended')),
  plan          text not null default 'basic' check (plan in ('basic', 'pro')),
  trial_ends_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- 3 a 40 caracteres: minúsculas, números y guiones (sin empezar/terminar en guion ni "--").
  constraint restaurants_slug_format check (
    slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$' and slug !~ '--'
  ),
  constraint restaurants_slug_reserved check (
    slug <> all (array[
      'app', 'api', 'admin', 'super', 'r', 'www', 'entrar', 'login', 'registro', 'signup',
      'auth', 'static', 'assets', 'soporte', 'ayuda', 'help', 'precios', 'blog', 'docs',
      'status', 'mail', 'terminos', 'privacidad', 'cuenta'
    ])
  ),
  -- Los archivos de marca solo pueden apuntar a la carpeta del propio restaurante.
  constraint restaurants_logo_in_tenant check (
    logo_path is null or (logo_path like id::text || '/%' and logo_path !~ '\.\.')
  ),
  constraint restaurants_cover_in_tenant check (
    cover_path is null or (cover_path like id::text || '/%' and cover_path !~ '\.\.')
  )
);

create table if not exists public.restaurant_members (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null check (role in ('owner', 'staff')),
  created_at    timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);
create index if not exists restaurant_members_user_idx on public.restaurant_members(user_id);

-- Plataformas y redes del restaurante. Solo https: evita enlaces "javascript:" u otros esquemas.
create table if not exists public.restaurant_links (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  kind          text not null check (kind in (
                  'pedidosya', 'ubereats', 'instagram', 'facebook', 'tiktok', 'website', 'maps'
                )),
  url           text not null check (url ~ '^https://[^\s<>"''`]+$' and char_length(url) <= 500),
  sort_order    int not null default 0,
  unique (restaurant_id, kind)
);

-- Consecutivo de pedidos por restaurante (#1, #2…). Solo lo toca place_order().
create table if not exists private.order_counters (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  last_number   int not null default 0
);

-- ───────────────────────── Menú ─────────────────────────

create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 60),
  sort_order    int  not null default 0,
  is_visible    boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (id, restaurant_id)
);
create index if not exists categories_restaurant_idx on public.categories(restaurant_id, sort_order);

create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id   uuid not null,
  name          text not null check (char_length(btrim(name)) between 1 and 80),
  description   text check (char_length(description) <= 500),
  price         numeric(10,2) not null check (price >= 0 and price < 10000000),
  is_available  boolean not null default true,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, restaurant_id),
  -- La categoría tiene que ser del mismo restaurante.
  foreign key (category_id, restaurant_id)
    references public.categories(id, restaurant_id) on delete restrict
);
create index if not exists items_restaurant_idx on public.items(restaurant_id, sort_order);
create index if not exists items_category_idx on public.items(category_id);

create table if not exists public.item_photos (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  item_id       uuid not null,
  path          text not null,
  is_primary    boolean not null default false,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  foreign key (item_id, restaurant_id)
    references public.items(id, restaurant_id) on delete cascade,
  constraint item_photos_path_in_tenant check (
    path like restaurant_id::text || '/%' and path !~ '\.\.'
  )
);
create index if not exists item_photos_item_idx on public.item_photos(item_id);
create unique index if not exists item_photos_one_primary
  on public.item_photos(item_id) where is_primary;

-- Variantes de tamaño/presentación (REG, MED, GRD…). items.price = precio "desde".
create table if not exists public.item_variants (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  item_id       uuid not null,
  label         text not null check (char_length(btrim(label)) between 1 and 30),
  price         numeric(10,2) not null check (price >= 0 and price < 10000000),
  sort_order    int not null default 0,
  foreign key (item_id, restaurant_id)
    references public.items(id, restaurant_id) on delete cascade
);
create index if not exists item_variants_item_idx on public.item_variants(item_id);

-- Zonas de entrega: cada una agrupa barrios con un costo fijo de delivery.
create table if not exists public.delivery_zones (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 1 and 60),
  neighborhoods text[] not null default '{}' check (cardinality(neighborhoods) <= 60),
  fee           numeric(10,2) not null check (fee >= 0 and fee < 1000000),
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists delivery_zones_restaurant_idx on public.delivery_zones(restaurant_id, sort_order);

-- ───────────────────────── Pedidos ─────────────────────────
-- Se guardan desde el día uno (base para estadísticas, comanda y facturación).
-- Nombre y precio se copian al momento de pedir: si luego cambia el menú, el pedido no cambia.

create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid not null references public.restaurants(id) on delete cascade,
  number         int not null,
  status         text not null default 'new' check (status in (
                   'new', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
                 )),
  fulfillment    text not null check (fulfillment in ('pickup', 'delivery')),
  customer_name  text check (char_length(customer_name) <= 60),
  customer_phone text check (customer_phone ~ '^[0-9]{7,15}$'),
  address        text check (char_length(address) <= 200),
  notes          text check (char_length(notes) <= 300),
  zone_name      text,
  delivery_fee   numeric(10,2) not null default 0,
  subtotal       numeric(12,2) not null,
  total          numeric(12,2) not null,
  currency       text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (restaurant_id, number),
  unique (id, restaurant_id)
);
create index if not exists orders_restaurant_created_idx on public.orders(restaurant_id, created_at desc);

create table if not exists public.order_items (
  id            uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  order_id      uuid not null,
  item_id       uuid references public.items(id) on delete set null,
  name          text not null,
  variant_label text,
  unit_price    numeric(10,2) not null,
  qty           int not null check (qty between 1 and 20),
  note          text check (char_length(note) <= 120),
  line_total    numeric(12,2) generated always as (unit_price * qty) stored,
  foreign key (order_id, restaurant_id)
    references public.orders(id, restaurant_id) on delete cascade
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ───────────────────────── Disparadores ─────────────────────────

create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists restaurants_touch on public.restaurants;
create trigger restaurants_touch before update on public.restaurants
  for each row execute function private.touch_updated_at();
drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items
  for each row execute function private.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function private.touch_updated_at();

-- ───────────────────────── Funciones de seguridad ─────────────────────────
-- SECURITY DEFINER para poder leer membresías sin depender de las políticas
-- (evita recursión) y "stable" + setof para que Postgres las evalúe una sola
-- vez por consulta (initplan) y no por cada fila.

create or replace function private.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.platform_admins where user_id = (select auth.uid()));
$$;

-- Restaurantes donde quien consulta es miembro (dueño o staff).
create or replace function private.my_restaurants() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select restaurant_id from public.restaurant_members where user_id = (select auth.uid());
$$;

-- Restaurantes donde quien consulta es dueño.
create or replace function private.owned_restaurants() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select restaurant_id from public.restaurant_members
  where user_id = (select auth.uid()) and role = 'owner';
$$;

-- ¿El menú del restaurante está en línea? Activo, o en prueba sin vencer.
create or replace function private.is_live(p_status text, p_trial_ends_at timestamptz)
returns boolean language sql stable set search_path = '' as $$
  select p_status = 'active'
      or (p_status = 'trial' and (p_trial_ends_at is null or p_trial_ends_at > now()));
$$;

create or replace function private.audit(p_action text, p_restaurant uuid, p_details jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into private.audit_log (actor_id, action, restaurant_id, details)
  values ((select auth.uid()), p_action, p_restaurant, coalesce(p_details, '{}'::jsonb));
$$;

revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.my_restaurants() to authenticated;
grant execute on function private.owned_restaurants() to authenticated;
grant execute on function private.is_super_admin() to authenticated;

-- ───────────────────────── Permisos de tablas ─────────────────────────
-- Primero se quita todo; luego se da solo lo necesario. anon no recibe nada.

revoke all on public.restaurants, public.restaurant_members, public.restaurant_links,
  public.categories, public.items, public.item_photos, public.item_variants,
  public.delivery_zones, public.orders, public.order_items
  from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;

grant select on public.restaurants, public.restaurant_members,
  public.orders, public.order_items to authenticated;
-- El dueño edita su perfil; plan, estado, prueba e id quedan fuera a propósito.
grant update (slug, name, tagline, description, logo_path, cover_path, brand_color,
  whatsapp, address, hours, currency, is_published) on public.restaurants to authenticated;
-- Del pedido solo se cambia el estado (los montos son historia).
grant update (status) on public.orders to authenticated;
grant select, insert, update, delete on public.restaurant_links, public.categories,
  public.items, public.item_photos, public.item_variants, public.delivery_zones
  to authenticated;

-- ───────────────────────── RLS ─────────────────────────

alter table public.restaurants        enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_links   enable row level security;
alter table public.categories         enable row level security;
alter table public.items              enable row level security;
alter table public.item_photos        enable row level security;
alter table public.item_variants      enable row level security;
alter table public.delivery_zones     enable row level security;
alter table public.orders             enable row level security;
alter table public.order_items        enable row level security;

drop policy if exists "members read restaurant" on public.restaurants;
create policy "members read restaurant" on public.restaurants
  for select to authenticated
  using (id in (select private.my_restaurants()));

drop policy if exists "owners update restaurant" on public.restaurants;
create policy "owners update restaurant" on public.restaurants
  for update to authenticated
  using (id in (select private.owned_restaurants()))
  with check (id in (select private.owned_restaurants()));

drop policy if exists "members read members" on public.restaurant_members;
create policy "members read members" on public.restaurant_members
  for select to authenticated
  using (restaurant_id in (select private.my_restaurants()));

-- Enlaces: los lee el equipo; los cambia el dueño.
drop policy if exists "members read links" on public.restaurant_links;
create policy "members read links" on public.restaurant_links
  for select to authenticated
  using (restaurant_id in (select private.my_restaurants()));

do $$
declare a text;
begin
  foreach a in array array['insert', 'update', 'delete'] loop
    execute format('drop policy if exists %I on public.restaurant_links', 'owners ' || a || ' links');
  end loop;
end $$;
create policy "owners insert links" on public.restaurant_links
  for insert to authenticated
  with check (restaurant_id in (select private.owned_restaurants()));
create policy "owners update links" on public.restaurant_links
  for update to authenticated
  using (restaurant_id in (select private.owned_restaurants()))
  with check (restaurant_id in (select private.owned_restaurants()));
create policy "owners delete links" on public.restaurant_links
  for delete to authenticated
  using (restaurant_id in (select private.owned_restaurants()));

-- Menú y zonas: dueño y staff gestionan los de su restaurante. Una política por acción.
do $$
declare t text;
begin
  foreach t in array array['categories', 'items', 'item_photos', 'item_variants', 'delivery_zones'] loop
    execute format('drop policy if exists %I on public.%I', 'tenant select', t);
    execute format('drop policy if exists %I on public.%I', 'tenant insert', t);
    execute format('drop policy if exists %I on public.%I', 'tenant update', t);
    execute format('drop policy if exists %I on public.%I', 'tenant delete', t);
    execute format($p$create policy "tenant select" on public.%I for select to authenticated
      using (restaurant_id in (select private.my_restaurants()))$p$, t);
    execute format($p$create policy "tenant insert" on public.%I for insert to authenticated
      with check (restaurant_id in (select private.my_restaurants()))$p$, t);
    execute format($p$create policy "tenant update" on public.%I for update to authenticated
      using (restaurant_id in (select private.my_restaurants()))
      with check (restaurant_id in (select private.my_restaurants()))$p$, t);
    execute format($p$create policy "tenant delete" on public.%I for delete to authenticated
      using (restaurant_id in (select private.my_restaurants()))$p$, t);
  end loop;
end $$;

drop policy if exists "members read orders" on public.orders;
create policy "members read orders" on public.orders
  for select to authenticated
  using (restaurant_id in (select private.my_restaurants()));

drop policy if exists "members update orders" on public.orders;
create policy "members update orders" on public.orders
  for update to authenticated
  using (restaurant_id in (select private.my_restaurants()))
  with check (restaurant_id in (select private.my_restaurants()));

drop policy if exists "members read order items" on public.order_items;
create policy "members read order items" on public.order_items
  for select to authenticated
  using (restaurant_id in (select private.my_restaurants()));

-- ───────────────────────── API pública (anon) ─────────────────────────

-- Menú público completo de un restaurante, solo si está en línea. Devuelve null si no existe,
-- está suspendido, venció la prueba o el dueño lo despublicó (sin decir cuál de los casos).
create or replace function public.get_public_menu(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r public.restaurants%rowtype;
begin
  select * into r from public.restaurants where slug = lower(btrim(p_slug));
  if not found or not r.is_published or not private.is_live(r.status, r.trial_ends_at) then
    return null;
  end if;

  return jsonb_build_object(
    'restaurant', jsonb_build_object(
      'id', r.id, 'slug', r.slug, 'name', r.name, 'tagline', r.tagline,
      'description', r.description, 'logo_path', r.logo_path, 'cover_path', r.cover_path,
      'brand_color', r.brand_color, 'whatsapp', r.whatsapp, 'address', r.address,
      'hours', r.hours, 'currency', r.currency
    ),
    'links', coalesce((
      select jsonb_agg(jsonb_build_object('kind', l.kind, 'url', l.url) order by l.sort_order, l.kind)
      from public.restaurant_links l where l.restaurant_id = r.id
    ), '[]'::jsonb),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'sort_order', c.sort_order, 'is_visible', true
      ) order by c.sort_order, c.name)
      from public.categories c where c.restaurant_id = r.id and c.is_visible
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'category_id', i.category_id, 'name', i.name,
        'description', i.description, 'price', i.price, 'is_available', i.is_available,
        'sort_order', i.sort_order,
        'item_photos', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', p.id, 'item_id', p.item_id, 'path', p.path,
            'is_primary', p.is_primary, 'sort_order', p.sort_order
          ) order by p.sort_order)
          from public.item_photos p where p.item_id = i.id
        ), '[]'::jsonb),
        'item_variants', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', v.id, 'item_id', v.item_id, 'label', v.label,
            'price', v.price, 'sort_order', v.sort_order
          ) order by v.sort_order)
          from public.item_variants v where v.item_id = i.id
        ), '[]'::jsonb)
      ) order by i.sort_order, i.name)
      from public.items i
      join public.categories c on c.id = i.category_id and c.restaurant_id = i.restaurant_id
      where i.restaurant_id = r.id and c.is_visible
    ), '[]'::jsonb),
    'zones', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', z.id, 'name', z.name, 'neighborhoods', to_jsonb(z.neighborhoods),
        'fee', z.fee, 'sort_order', z.sort_order
      ) order by z.sort_order)
      from public.delivery_zones z where z.restaurant_id = r.id and z.is_active
    ), '[]'::jsonb)
  );
end $$;

-- Registra un pedido. No confía en nada del cliente salvo qué platos y cuántos:
-- precios, nombres, variantes y costo de entrega salen de la base de datos.
create or replace function public.place_order(
  p_slug           text,
  p_lines          jsonb,
  p_fulfillment    text,
  p_zone_id        uuid default null,
  p_customer_name  text default null,
  p_customer_phone text default null,
  p_address        text default null,
  p_notes          text default null
) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  r          public.restaurants%rowtype;
  v_line     jsonb;
  v_item_id  uuid;
  v_var_id   uuid;
  v_qty      int;
  v_note     text;
  v_name     text;
  v_label    text;
  v_unit     numeric(10,2);
  v_lines    jsonb := '[]'::jsonb;
  v_subtotal numeric(12,2) := 0;
  v_fee      numeric(10,2) := 0;
  v_zone     jsonb := null;
  v_number   int;
  v_order_id uuid;
  v_phone    text;
begin
  select * into r from public.restaurants where slug = lower(btrim(p_slug));
  if not found or not r.is_published or not private.is_live(r.status, r.trial_ends_at) then
    raise exception 'restaurant_unavailable';
  end if;

  if p_fulfillment is null or p_fulfillment not in ('pickup', 'delivery') then
    raise exception 'invalid_fulfillment';
  end if;
  if jsonb_typeof(p_lines) is distinct from 'array'
     or jsonb_array_length(p_lines) = 0 or jsonb_array_length(p_lines) > 50 then
    raise exception 'invalid_lines';
  end if;

  -- Freno contra abuso: como máximo 20 pedidos por minuto por restaurante.
  if (select count(*) from public.orders
      where restaurant_id = r.id and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate_limited';
  end if;

  for v_line in select value from jsonb_array_elements(p_lines) loop
    begin
      v_item_id := (v_line->>'item_id')::uuid;
      v_var_id  := nullif(v_line->>'variant_id', '')::uuid;
      v_qty     := (v_line->>'qty')::int;
    exception when others then
      raise exception 'invalid_lines';
    end;
    if v_item_id is null or v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception 'invalid_lines';
    end if;
    v_note := nullif(left(btrim(coalesce(v_line->>'note', '')), 120), '');

    select i.name, i.price into v_name, v_unit
    from public.items i
    join public.categories c on c.id = i.category_id and c.restaurant_id = i.restaurant_id
    where i.id = v_item_id and i.restaurant_id = r.id and i.is_available and c.is_visible;
    if not found then
      raise exception 'item_unavailable' using detail = v_item_id::text;
    end if;

    v_label := null;
    if v_var_id is not null then
      select v.label, v.price into v_label, v_unit
      from public.item_variants v
      where v.id = v_var_id and v.item_id = v_item_id and v.restaurant_id = r.id;
      if not found then
        raise exception 'item_unavailable' using detail = v_item_id::text;
      end if;
    elsif exists (select 1 from public.item_variants v where v.item_id = v_item_id) then
      raise exception 'variant_required' using detail = v_item_id::text;
    end if;

    v_subtotal := v_subtotal + v_unit * v_qty;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'item_id', v_item_id, 'name', v_name, 'variant_label', v_label,
      'unit_price', v_unit, 'qty', v_qty, 'note', v_note, 'line_total', v_unit * v_qty
    ));
  end loop;

  if p_fulfillment = 'delivery' then
    if p_zone_id is not null then
      select jsonb_build_object('name', z.name, 'neighborhoods', to_jsonb(z.neighborhoods)), z.fee
        into v_zone, v_fee
      from public.delivery_zones z
      where z.id = p_zone_id and z.restaurant_id = r.id and z.is_active;
      if not found then
        raise exception 'zone_unavailable';
      end if;
    elsif exists (select 1 from public.delivery_zones z where z.restaurant_id = r.id and z.is_active) then
      raise exception 'zone_required';
    end if;
  end if;

  v_phone := nullif(regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g'), '');
  if v_phone is not null and v_phone !~ '^[0-9]{7,15}$' then
    v_phone := null;
  end if;

  insert into private.order_counters as oc (restaurant_id, last_number) values (r.id, 1)
  on conflict (restaurant_id) do update set last_number = oc.last_number + 1
  returning last_number into v_number;

  insert into public.orders (
    restaurant_id, number, fulfillment, customer_name, customer_phone, address, notes,
    zone_name, delivery_fee, subtotal, total, currency
  ) values (
    r.id, v_number, p_fulfillment,
    nullif(left(btrim(coalesce(p_customer_name, '')), 60), ''),
    v_phone,
    nullif(left(btrim(coalesce(p_address, '')), 200), ''),
    nullif(left(btrim(coalesce(p_notes, '')), 300), ''),
    v_zone->>'name', v_fee, v_subtotal, v_subtotal + v_fee, r.currency
  ) returning id into v_order_id;

  insert into public.order_items (restaurant_id, order_id, item_id, name, variant_label, unit_price, qty, note)
  select r.id, v_order_id, (l->>'item_id')::uuid, l->>'name', l->>'variant_label',
         (l->>'unit_price')::numeric, (l->>'qty')::int, l->>'note'
  from jsonb_array_elements(v_lines) as l;

  return jsonb_build_object(
    'id', v_order_id, 'number', v_number, 'lines', v_lines,
    'subtotal', v_subtotal, 'delivery_fee', v_fee, 'total', v_subtotal + v_fee,
    'currency', r.currency, 'fulfillment', p_fulfillment, 'zone', v_zone
  );
end $$;

-- ───────────────────────── API de cuenta (authenticated) ─────────────────────────

create or replace function public.slug_available(p_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.restaurants where slug = lower(btrim(p_slug)));
$$;

-- Alta de restaurante: lo crea en prueba (14 días) y deja a quien llama como dueño.
-- MVP: una cuenta = un restaurante (los super admins pueden crear más).
create or replace function public.create_restaurant(
  p_name text, p_slug text, p_whatsapp text default null
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if not private.is_super_admin()
     and exists (select 1 from public.restaurant_members where user_id = v_uid and role = 'owner') then
    raise exception 'limit_reached';
  end if;

  begin
    insert into public.restaurants (name, slug, whatsapp, status, plan, trial_ends_at)
    values (
      btrim(p_name), lower(btrim(p_slug)),
      nullif(regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g'), ''),
      'trial', 'basic', now() + interval '14 days'
    ) returning id into v_id;
  exception when unique_violation then
    raise exception 'slug_taken';
  end;

  insert into public.restaurant_members (restaurant_id, user_id, role) values (v_id, v_uid, 'owner');
  insert into private.order_counters (restaurant_id) values (v_id);
  perform private.audit('restaurant.create', v_id, jsonb_build_object('slug', lower(btrim(p_slug))));
  return v_id;
end $$;

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_super_admin();
$$;

-- Cambia la foto principal de forma atómica. SECURITY INVOKER: respeta RLS,
-- así que con una foto de otro restaurante simplemente no encuentra nada.
create or replace function public.set_primary_photo(p_photo_id uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_item uuid;
begin
  select item_id into v_item from public.item_photos where id = p_photo_id;
  if v_item is null then return; end if;
  update public.item_photos set is_primary = false where item_id = v_item and is_primary;
  update public.item_photos set is_primary = true where id = p_photo_id;
end $$;

-- ───────────────────────── API de super admin ─────────────────────────
-- Todas verifican el rol al inicio. No hay políticas que den al super admin
-- acceso directo a las tablas: todo pasa por aquí y queda auditado.

create or replace function private.require_super_admin() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
end $$;

create or replace function public.admin_list_restaurants()
returns table (
  id uuid, slug text, name text, status text, plan text, trial_ends_at timestamptz,
  is_published boolean, is_live boolean, created_at timestamptz, owner_email text,
  items_count bigint, orders_7d bigint, orders_total bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_super_admin();
  return query
  select r.id, r.slug, r.name, r.status, r.plan, r.trial_ends_at, r.is_published,
         private.is_live(r.status, r.trial_ends_at), r.created_at,
         (select u.email::text from public.restaurant_members m
            join auth.users u on u.id = m.user_id
          where m.restaurant_id = r.id and m.role = 'owner'
          order by m.created_at limit 1),
         (select count(*) from public.items i where i.restaurant_id = r.id),
         (select count(*) from public.orders o
          where o.restaurant_id = r.id and o.created_at > now() - interval '7 days'),
         (select count(*) from public.orders o where o.restaurant_id = r.id)
  from public.restaurants r
  order by r.created_at desc;
end $$;

create or replace function public.admin_update_restaurant(
  p_id uuid, p_status text default null, p_plan text default null,
  p_trial_ends_at timestamptz default null
) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_before jsonb;
begin
  perform private.require_super_admin();
  select jsonb_build_object('status', status, 'plan', plan, 'trial_ends_at', trial_ends_at)
    into v_before from public.restaurants where id = p_id;
  if v_before is null then
    raise exception 'not_found';
  end if;

  update public.restaurants set
    status        = coalesce(p_status, status),
    plan          = coalesce(p_plan, plan),
    trial_ends_at = coalesce(p_trial_ends_at, trial_ends_at)
  where id = p_id;

  perform private.audit('restaurant.update', p_id, jsonb_build_object(
    'before', v_before,
    'after', jsonb_strip_nulls(jsonb_build_object(
      'status', p_status, 'plan', p_plan, 'trial_ends_at', p_trial_ends_at
    ))
  ));
end $$;

create or replace function public.admin_stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_super_admin();
  return jsonb_build_object(
    'restaurants', (select count(*) from public.restaurants),
    'live', (select count(*) from public.restaurants r where private.is_live(r.status, r.trial_ends_at)),
    'trial', (select count(*) from public.restaurants where status = 'trial'),
    'active', (select count(*) from public.restaurants where status = 'active'),
    'suspended', (select count(*) from public.restaurants where status = 'suspended'),
    'new_7d', (select count(*) from public.restaurants where created_at > now() - interval '7 days'),
    'orders_7d', (select count(*) from public.orders where created_at > now() - interval '7 days'),
    'orders_total', (select count(*) from public.orders)
  );
end $$;

create or replace function public.admin_audit_log(p_limit int default 100)
returns table (at timestamptz, actor_email text, action text, restaurant_name text, details jsonb)
language plpgsql stable security definer set search_path = '' as $$
begin
  perform private.require_super_admin();
  return query
  select a.at, u.email::text, a.action, r.name, a.details
  from private.audit_log a
  left join auth.users u on u.id = a.actor_id
  left join public.restaurants r on r.id = a.restaurant_id
  order by a.at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end $$;

-- Permisos de ejecución: nada por defecto, y luego solo lo necesario.
revoke all on function public.get_public_menu(text) from public, anon, authenticated;
revoke all on function public.place_order(text, jsonb, text, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.slug_available(text) from public, anon, authenticated;
revoke all on function public.create_restaurant(text, text, text) from public, anon, authenticated;
revoke all on function public.is_platform_admin() from public, anon, authenticated;
revoke all on function public.set_primary_photo(uuid) from public, anon, authenticated;
revoke all on function public.admin_list_restaurants() from public, anon, authenticated;
revoke all on function public.admin_update_restaurant(uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.admin_stats() from public, anon, authenticated;
revoke all on function public.admin_audit_log(int) from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

grant execute on function public.get_public_menu(text) to anon, authenticated;
grant execute on function public.place_order(text, jsonb, text, uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.slug_available(text) to authenticated;
grant execute on function public.create_restaurant(text, text, text) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.set_primary_photo(uuid) to authenticated;
grant execute on function public.admin_list_restaurants() to authenticated;
grant execute on function public.admin_update_restaurant(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.admin_stats() to authenticated;
grant execute on function public.admin_audit_log(int) to authenticated;
grant execute on function private.my_restaurants() to authenticated;
grant execute on function private.owned_restaurants() to authenticated;
grant execute on function private.is_super_admin() to authenticated;

-- ───────────────────────── Storage ─────────────────────────
-- Un bucket público para leer. Cada restaurante escribe solo en su carpeta:
--   {restaurant_id}/items/{item_id}/{uuid}.webp   y   {restaurant_id}/brand/{uuid}.webp

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "tenant read own media" on storage.objects;
create policy "tenant read own media" on storage.objects
  for select to authenticated
  using (bucket_id = 'media'
    and (storage.foldername(name))[1] in (select r::text from private.my_restaurants() as r));

drop policy if exists "tenant upload media" on storage.objects;
create policy "tenant upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media'
    and (storage.foldername(name))[1] in (select r::text from private.my_restaurants() as r));

drop policy if exists "tenant update media" on storage.objects;
create policy "tenant update media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media'
    and (storage.foldername(name))[1] in (select r::text from private.my_restaurants() as r))
  with check (bucket_id = 'media'
    and (storage.foldername(name))[1] in (select r::text from private.my_restaurants() as r));

drop policy if exists "tenant delete media" on storage.objects;
create policy "tenant delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media'
    and (storage.foldername(name))[1] in (select r::text from private.my_restaurants() as r));

-- ───────────────────────── PASO MANUAL ─────────────────────────
-- Para hacerte super admin, crea tu usuario (registrándote en /entrar) y corre:
--
-- insert into private.platform_admins (user_id)
-- select id from auth.users where email = 'TU_CORREO@ejemplo.com'
-- on conflict do nothing;
