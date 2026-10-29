-- ════════════════════════════════════════════════════════════════════════════
-- Visitas al menú público, agregadas por día (una fila por restaurante y día).
-- No guarda nada del visitante. Solo se escribe con track_menu_view(slug).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.menu_views_daily (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  day           date not null,
  views         int  not null default 0 check (views >= 0),
  primary key (restaurant_id, day)
);

revoke all on public.menu_views_daily from public, anon, authenticated;
grant select on public.menu_views_daily to authenticated;

alter table public.menu_views_daily enable row level security;

drop policy if exists "members read views" on public.menu_views_daily;
create policy "members read views" on public.menu_views_daily
  for select to authenticated
  using (restaurant_id in (select private.my_restaurants()));

-- Suma una visita al día de hoy (hora de Santo Domingo). Solo cuenta menús en línea;
-- para un slug que no existe o un menú suspendido no hace nada (ni da error).
create or replace function public.track_menu_view(p_slug text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare r public.restaurants%rowtype;
begin
  select * into r from public.restaurants where slug = lower(btrim(p_slug));
  if not found or not r.is_published or not private.is_live(r.status, r.trial_ends_at) then
    return;
  end if;
  insert into public.menu_views_daily as v (restaurant_id, day, views)
  values (r.id, (now() at time zone 'America/Santo_Domingo')::date, 1)
  on conflict (restaurant_id, day) do update set views = v.views + 1;
end $$;

revoke all on function public.track_menu_view(text) from public, anon, authenticated;
grant execute on function public.track_menu_view(text) to anon, authenticated;

-- Super admin: se agregan las visitas de 7 días al listado y a las estadísticas.
-- (Cambia las columnas que devuelve, así que hay que borrarla y crearla de nuevo.)
drop function if exists public.admin_list_restaurants();
create function public.admin_list_restaurants()
returns table (
  id uuid, slug text, name text, status text, plan text, trial_ends_at timestamptz,
  is_published boolean, is_live boolean, created_at timestamptz, owner_email text,
  items_count bigint, orders_7d bigint, orders_total bigint, views_7d bigint
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
         (select count(*) from public.orders o where o.restaurant_id = r.id),
         (select coalesce(sum(v.views), 0)::bigint from public.menu_views_daily v
          where v.restaurant_id = r.id and v.day > (now() at time zone 'America/Santo_Domingo')::date - 7)
  from public.restaurants r
  order by r.created_at desc;
end $$;
revoke all on function public.admin_list_restaurants() from public, anon, authenticated;
grant execute on function public.admin_list_restaurants() to authenticated;

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
    'orders_total', (select count(*) from public.orders),
    'views_7d', (select coalesce(sum(views), 0) from public.menu_views_daily
                 where day > (now() at time zone 'America/Santo_Domingo')::date - 7)
  );
end $$;
