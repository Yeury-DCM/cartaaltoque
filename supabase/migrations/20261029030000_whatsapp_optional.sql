-- WhatsApp opcional: un restaurante sin WhatsApp muestra su menú sin carrito, y la base
-- de datos tampoco acepta pedidos para él (el cliente no tendría adónde enviarlos).
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
  -- Sin WhatsApp el negocio no tiene por dónde recibir el pedido: el menú es solo una carta.
  if r.whatsapp is null then
    raise exception 'ordering_unavailable';
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

revoke all on function public.place_order(text, jsonb, text, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.place_order(text, jsonb, text, uuid, text, text, text, text) to anon, authenticated;
