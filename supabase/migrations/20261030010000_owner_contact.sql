-- ════════════════════════════════════════════════════════════════════════════
-- Teléfono privado de contacto del dueño (para que la plataforma le ayude a empezar).
-- No es el WhatsApp de pedidos: este nunca se muestra en el menú público.
-- Lo ve y edita el equipo del restaurante; la plataforma lo ve solo vía admin_list_restaurants.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.restaurant_contacts (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  phone         text not null check (phone ~ '^[0-9]{8,15}$'),
  updated_at    timestamptz not null default now()
);

revoke all on public.restaurant_contacts from public, anon, authenticated;
grant select, insert, delete on public.restaurant_contacts to authenticated;
grant update (phone, updated_at) on public.restaurant_contacts to authenticated;

alter table public.restaurant_contacts enable row level security;

drop policy if exists "members read contact" on public.restaurant_contacts;
create policy "members read contact" on public.restaurant_contacts
  for select to authenticated
  using (restaurant_id in (select private.my_restaurants()));

drop policy if exists "members add contact" on public.restaurant_contacts;
create policy "members add contact" on public.restaurant_contacts
  for insert to authenticated
  with check (restaurant_id in (select private.my_restaurants()));

drop policy if exists "members edit contact" on public.restaurant_contacts;
create policy "members edit contact" on public.restaurant_contacts
  for update to authenticated
  using (restaurant_id in (select private.my_restaurants()))
  with check (restaurant_id in (select private.my_restaurants()));

drop policy if exists "members remove contact" on public.restaurant_contacts;
create policy "members remove contact" on public.restaurant_contacts
  for delete to authenticated
  using (restaurant_id in (select private.my_restaurants()));

-- Super admin: el listado trae el teléfono de contacto (cambia las columnas, se recrea).
drop function if exists public.admin_list_restaurants();
create function public.admin_list_restaurants()
returns table (
  id uuid, slug text, name text, status text, plan text, trial_ends_at timestamptz,
  is_published boolean, is_live boolean, created_at timestamptz, owner_email text,
  items_count bigint, orders_7d bigint, orders_total bigint, views_7d bigint,
  contact_phone text
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
          where v.restaurant_id = r.id and v.day > (now() at time zone 'America/Santo_Domingo')::date - 7),
         (select c.phone from public.restaurant_contacts c where c.restaurant_id = r.id)
  from public.restaurants r
  order by r.created_at desc;
end $$;
revoke all on function public.admin_list_restaurants() from public, anon, authenticated;
grant execute on function public.admin_list_restaurants() to authenticated;
