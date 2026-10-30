-- ════════════════════════════════════════════════════════════════════════════
-- Platos más abiertos: cuántas veces se abre el detalle de cada plato, por día.
-- Igual que las visitas: agregado, sin datos del visitante, solo se escribe con
-- track_item_open(slug, item_id).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.item_opens_daily (
  restaurant_id uuid not null,
  item_id       uuid not null,
  day           date not null,
  opens         int  not null default 0 check (opens >= 0),
  primary key (item_id, day),
  foreign key (item_id, restaurant_id) references public.items(id, restaurant_id) on delete cascade
);
create index if not exists item_opens_restaurant_idx on public.item_opens_daily(restaurant_id, day);

revoke all on public.item_opens_daily from public, anon, authenticated;
grant select on public.item_opens_daily to authenticated;

alter table public.item_opens_daily enable row level security;

drop policy if exists "members read item opens" on public.item_opens_daily;
create policy "members read item opens" on public.item_opens_daily
  for select to authenticated
  using (restaurant_id in (select private.my_restaurants()));

-- Suma una apertura al día de hoy (hora de Santo Domingo). Solo cuenta platos de un menú
-- en línea; un slug o un plato que no corresponde no hace nada (ni da error).
create or replace function public.track_item_open(p_slug text, p_item_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare r public.restaurants%rowtype;
begin
  select * into r from public.restaurants where slug = lower(btrim(p_slug));
  if not found or not r.is_published or not private.is_live(r.status, r.trial_ends_at) then
    return;
  end if;
  if not exists (select 1 from public.items i where i.id = p_item_id and i.restaurant_id = r.id) then
    return;
  end if;
  insert into public.item_opens_daily as o (restaurant_id, item_id, day, opens)
  values (r.id, p_item_id, (now() at time zone 'America/Santo_Domingo')::date, 1)
  on conflict (item_id, day) do update set opens = o.opens + 1;
end $$;

revoke all on function public.track_item_open(text, uuid) from public, anon, authenticated;
grant execute on function public.track_item_open(text, uuid) to anon, authenticated;
