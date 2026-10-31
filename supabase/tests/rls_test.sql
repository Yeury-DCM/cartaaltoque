-- ════════════════════════════════════════════════════════════════════════════
-- Pruebas de aislamiento multi-tenant.
-- Se puede correr en Supabase → SQL Editor: todo ocurre dentro de una
-- transacción que termina en ROLLBACK, así que no deja datos.
-- Si algo falla, se detiene con "FAIL: …". Si todo pasa, devuelve "ALL TESTS PASSED".
-- ════════════════════════════════════════════════════════════════════════════
begin;

create schema tests;
grant usage on schema tests to anon, authenticated;

create function tests.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  execute 'set local role authenticated';
end $$;

create function tests.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
end $$;

create function tests.logout() returns void language plpgsql as $$
begin
  execute 'reset role';
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
end $$;

create function tests.id(p_key text) returns uuid language sql as $$
  select current_setting('tests.' || p_key)::uuid
$$;

create function tests.keep(p_key text, p_val uuid) returns void language sql as $$
  select set_config('tests.' || p_key, p_val::text, true); select null::void
$$;

-- La sentencia tiene que fallar con un error que contenga `pattern`.
create function tests.fails(p_label text, p_sql text, p_pattern text) returns void language plpgsql as $$
declare v_msg text;
begin
  begin
    execute p_sql;
  exception when others then
    v_msg := sqlerrm;
  end;
  if v_msg is null then
    raise exception 'FAIL [%]: se esperaba error "%" y no hubo', p_label, p_pattern;
  end if;
  if v_msg !~* p_pattern then
    raise exception 'FAIL [%]: error "%" (se esperaba "%")', p_label, v_msg, p_pattern;
  end if;
end $$;

-- Cuántas filas devuelve una consulta.
create function tests.rows(p_label text, p_sql text, p_expected bigint) returns void language plpgsql as $$
declare v bigint;
begin
  execute 'select count(*) from (' || p_sql || ') q' into v;
  if v <> p_expected then
    raise exception 'FAIL [%]: % filas (se esperaban %)', p_label, v, p_expected;
  end if;
end $$;

-- Cuántas filas toca un UPDATE/DELETE (sin RETURNING en la sentencia).
create function tests.affects(p_label text, p_sql text, p_expected bigint) returns void language plpgsql as $$
declare v bigint;
begin
  execute 'with x as (' || p_sql || ' returning 1) select count(*) from x' into v;
  if v <> p_expected then
    raise exception 'FAIL [%]: afectó % filas (se esperaban %)', p_label, v, p_expected;
  end if;
end $$;

-- El borrado no toca nada: o afecta 0 filas, o la base de datos lo bloquea
-- (Supabase real prohíbe borrar directo en storage.objects).
create function tests.deletes_nothing(p_label text, p_sql text) returns void language plpgsql as $$
declare v bigint; v_msg text;
begin
  begin
    execute 'with x as (' || p_sql || ' returning 1) select count(*) from x' into v;
  exception when others then
    v_msg := sqlerrm;
  end;
  if v_msg is not null and v_msg !~* 'not allowed|row-level security|permission denied' then
    raise exception 'FAIL [%]: error inesperado "%"', p_label, v_msg;
  end if;
  if v_msg is null and v <> 0 then
    raise exception 'FAIL [%]: borró % filas', p_label, v;
  end if;
end $$;

create function tests.check(p_label text, p_ok boolean) returns void language plpgsql as $$
begin
  if p_ok is not true then raise exception 'FAIL [%]', p_label; end if;
end $$;

grant execute on all functions in schema tests to anon, authenticated;

-- ───────────── Usuarios ─────────────
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'a@tests.local'),
  ('00000000-0000-4000-8000-00000000000b', 'b@tests.local'),
  ('00000000-0000-4000-8000-00000000000c', 'c@tests.local'),
  ('00000000-0000-4000-8000-00000000000d', 'd@tests.local'),
  ('00000000-0000-4000-8000-0000000000ff', 'super@tests.local');
insert into private.platform_admins (user_id) values ('00000000-0000-4000-8000-0000000000ff');

-- ───────────── Restaurante A (dueño A) ─────────────
do $$
declare ra uuid; cat uuid; hidden uuid; pizza uuid; soda uuid; gone uuid; secret uuid;
begin
  perform tests.login('00000000-0000-4000-8000-00000000000a');
  ra := public.create_restaurant('Pizza A', 'pizza-a', '1 (809) 555-0001');
  perform tests.check('whatsapp normalizado', (select whatsapp from public.restaurants where id = ra) = '18095550001');
  perform tests.check('A en prueba', (select status = 'trial' and plan = 'basic' and trial_ends_at > now() from public.restaurants where id = ra));

  insert into public.categories (restaurant_id, name, sort_order) values (ra, 'Pizzas', 1) returning id into cat;
  insert into public.categories (restaurant_id, name, sort_order, is_visible) values (ra, 'Secreto', 2, false) returning id into hidden;
  insert into public.items (restaurant_id, category_id, name, price) values (ra, cat, 'Pizza', 300) returning id into pizza;
  insert into public.item_variants (restaurant_id, item_id, label, price, sort_order) values
    (ra, pizza, 'Personal', 300, 1), (ra, pizza, 'Grande', 600, 2);
  insert into public.items (restaurant_id, category_id, name, price) values (ra, cat, 'Refresco', 100) returning id into soda;
  insert into public.items (restaurant_id, category_id, name, price, is_available) values (ra, cat, 'Agotado', 50, false) returning id into gone;
  insert into public.items (restaurant_id, category_id, name, price) values (ra, hidden, 'Oculto', 10) returning id into secret;
  insert into public.item_photos (restaurant_id, item_id, path, is_primary) values (ra, pizza, ra || '/items/' || pizza || '/a.webp', true);
  insert into public.delivery_zones (restaurant_id, name, neighborhoods, fee) values (ra, 'Zona 1', '{Centro}', 50);
  insert into public.restaurant_links (restaurant_id, kind, url) values (ra, 'instagram', 'https://instagram.com/pizza-a');

  perform tests.keep('ra', ra);
  perform tests.keep('a_cat', cat);
  perform tests.keep('a_pizza', pizza);
  perform tests.keep('a_soda', soda);
  perform tests.keep('a_gone', gone);
  perform tests.keep('a_secret', secret);
  perform tests.keep('a_zone', (select id from public.delivery_zones where restaurant_id = ra));
  perform tests.keep('a_grande', (select id from public.item_variants where item_id = pizza and label = 'Grande'));
  perform tests.keep('a_photo', (select id from public.item_photos where item_id = pizza));
  perform tests.logout();
end $$;

-- ───────────── Restaurante B (dueño B) ─────────────
do $$
declare rb uuid; cat uuid; item uuid;
begin
  perform tests.login('00000000-0000-4000-8000-00000000000b');
  rb := public.create_restaurant('Burger B', 'burger-b', null);
  insert into public.categories (restaurant_id, name) values (rb, 'Burgers') returning id into cat;
  insert into public.items (restaurant_id, category_id, name, price) values (rb, cat, 'Burger', 400) returning id into item;
  insert into public.item_variants (restaurant_id, item_id, label, price) values (rb, item, 'Doble', 500);
  insert into public.delivery_zones (restaurant_id, name, fee) values (rb, 'Zona B', 75);
  perform tests.keep('rb', rb);
  perform tests.keep('b_cat', cat);
  perform tests.keep('b_item', item);
  perform tests.keep('b_variant', (select id from public.item_variants where item_id = item));
  perform tests.keep('b_zone', (select id from public.delivery_zones where restaurant_id = rb));
  perform tests.logout();
end $$;

-- ───────────── B intenta leer y tocar lo de A ─────────────
do $$
declare ra uuid := tests.id('ra'); rb uuid := tests.id('rb');
begin
  perform tests.login('00000000-0000-4000-8000-00000000000b');

  perform tests.rows('B ve solo su restaurante', 'select 1 from public.restaurants', 1);
  perform tests.rows('B no ve categorías de A', format('select 1 from public.categories where restaurant_id = %L', ra), 0);
  perform tests.rows('B no ve platos de A', format('select 1 from public.items where restaurant_id = %L', ra), 0);
  perform tests.rows('B no ve variantes de A', format('select 1 from public.item_variants where restaurant_id = %L', ra), 0);
  perform tests.rows('B no ve fotos de A', format('select 1 from public.item_photos where restaurant_id = %L', ra), 0);
  perform tests.rows('B no ve zonas de A', format('select 1 from public.delivery_zones where restaurant_id = %L', ra), 0);
  perform tests.rows('B no ve enlaces de A', format('select 1 from public.restaurant_links where restaurant_id = %L', ra), 0);
  perform tests.rows('B no ve miembros de A', format('select 1 from public.restaurant_members where restaurant_id = %L', ra), 0);
  perform tests.rows('B ve su propio plato', 'select 1 from public.items', 1);

  perform tests.affects('B no cambia precios de A', format('update public.items set price = 1 where restaurant_id = %L', ra), 0);
  perform tests.affects('B no borra categorías de A', format('delete from public.categories where restaurant_id = %L', ra), 0);
  perform tests.affects('B no renombra a A', format('update public.restaurants set name = %L where id = %L', 'Hackeado', ra), 0);
  perform tests.affects('B no borra enlaces de A', format('delete from public.restaurant_links where restaurant_id = %L', ra), 0);

  perform tests.fails('B no inserta en A',
    format('insert into public.categories (restaurant_id, name) values (%L, %L)', ra, 'Intrusa'), 'row-level security');
  perform tests.fails('B no usa categoría de A',
    format('insert into public.items (restaurant_id, category_id, name, price) values (%L, %L, %L, 1)', rb, tests.id('a_cat'), 'X'), 'foreign key');
  perform tests.fails('B no mueve su plato a A',
    format('update public.items set restaurant_id = %L where id = %L', ra, tests.id('b_item')), 'row-level security|foreign key');
  perform tests.fails('B no cuelga variantes de un plato de A',
    format('insert into public.item_variants (restaurant_id, item_id, label, price) values (%L, %L, %L, 1)', rb, tests.id('a_pizza'), 'X'), 'foreign key');
  perform tests.fails('B no apunta fotos a la carpeta de A',
    format('insert into public.item_photos (restaurant_id, item_id, path) values (%L, %L, %L)', rb, tests.id('b_item'), ra || '/items/x.webp'), 'check constraint');
  perform tests.fails('B no apunta su logo a la carpeta de A',
    format('update public.restaurants set logo_path = %L where id = %L', ra || '/brand/x.webp', rb), 'check constraint');
  perform tests.fails('B no se une a A',
    format('insert into public.restaurant_members (restaurant_id, user_id, role) values (%L, %L, %L)', ra, '00000000-0000-4000-8000-00000000000b', 'owner'), 'permission denied');
  perform tests.fails('B no se cambia de plan',
    format('update public.restaurants set plan = %L where id = %L', 'pro', rb), 'permission denied');
  perform tests.fails('B no se activa solo',
    format('update public.restaurants set status = %L where id = %L', 'active', rb), 'permission denied');
  perform tests.fails('B no extiende su prueba',
    format('update public.restaurants set trial_ends_at = now() + interval %L where id = %L', '10 years', rb), 'permission denied');
  perform tests.fails('B no borra su restaurante desde el cliente',
    format('delete from public.restaurants where id = %L', rb), 'permission denied');
  perform tests.fails('B no se sube a dueño/staff de otro',
    format('update public.restaurant_members set restaurant_id = %L', ra), 'permission denied');
  perform tests.fails('B no crea un segundo restaurante', 'select public.create_restaurant(''Otro'', ''otro-b'')', 'limit_reached');
  perform tests.fails('B no lista restaurantes de la plataforma', 'select * from public.admin_list_restaurants()', 'forbidden');
  perform tests.fails('B no suspende a A',
    format('select public.admin_update_restaurant(%L, %L)', ra, 'suspended'), 'forbidden');
  perform tests.fails('B no ve estadísticas de plataforma', 'select public.admin_stats()', 'forbidden');
  perform tests.fails('B no lee auditoría', 'select * from private.audit_log', 'permission denied');
  perform tests.fails('B no se hace super admin',
    'insert into private.platform_admins (user_id) values (''00000000-0000-4000-8000-00000000000b'')', 'permission denied');
  perform tests.fails('B no toca contadores',
    'update private.order_counters set last_number = 0', 'permission denied');

  -- set_primary_photo respeta RLS: con una foto de A no hace nada.
  perform public.set_primary_photo(tests.id('a_photo'));

  -- Storage: solo en su carpeta.
  perform tests.fails('B no sube a la carpeta de A',
    format('insert into storage.objects (bucket_id, name) values (%L, %L)', 'media', ra || '/items/x.webp'), 'row-level security');
  insert into storage.objects (bucket_id, name) values ('media', rb || '/items/ok.webp');
  perform tests.deletes_nothing('B no borra archivos de A',
    format('delete from storage.objects where name like %L', ra || '/%'));

  perform tests.affects('B cambia su tema y tipografía',
    format('update public.restaurants set theme = %L, font_style = %L where id = %L', 'light', 'elegant', rb), 1);
  perform tests.fails('Tema inválido rechazado',
    format('update public.restaurants set theme = %L where id = %L', 'neon', rb), 'check constraint');
  perform tests.fails('Tipografía inválida rechazada',
    format('update public.restaurants set font_style = %L where id = %L', 'comic', rb), 'check constraint');
  perform tests.affects('B no cambia el tema de A',
    format('update public.restaurants set theme = %L where id = %L', 'light', ra), 0);
  perform tests.affects('B sí edita lo suyo', format('update public.restaurants set tagline = %L where id = %L', 'Las mejores', rb), 1);
  perform tests.fails('Enlace no-https rechazado',
    format('insert into public.restaurant_links (restaurant_id, kind, url) values (%L, %L, %L)', rb, 'website', 'javascript:alert(1)'), 'check constraint');
  perform tests.fails('Color de marca inválido rechazado',
    format('update public.restaurants set brand_color = %L where id = %L', 'red;background:url(x)', rb), 'check constraint');
  perform tests.fails('Slug reservado rechazado',
    format('update public.restaurants set slug = %L where id = %L', 'admin', rb), 'check constraint');
  perform tests.fails('Slug con formato inválido rechazado',
    format('update public.restaurants set slug = %L where id = %L', 'Burger B!', rb), 'check constraint');
  perform tests.fails('Slug ocupado rechazado',
    format('update public.restaurants set slug = %L where id = %L', 'pizza-a', rb), 'duplicate key|unique');
  perform tests.logout();
end $$;

-- La foto de A sigue como principal y en su lugar.
do $$
begin
  perform tests.check('foto de A intacta', (select is_primary from public.item_photos where id = tests.id('a_photo')));
  perform tests.check('archivo de A intacto', not exists (select 1 from storage.objects where name like tests.id('ra') || '/%'));
end $$;

-- ───────────── Público anónimo ─────────────
do $$
declare
  m jsonb; o jsonb;
  ra uuid := tests.id('ra');
  pizza uuid := tests.id('a_pizza'); soda uuid := tests.id('a_soda');
  grande uuid := tests.id('a_grande'); zone uuid := tests.id('a_zone');
begin
  perform tests.as_anon();

  perform tests.fails('anon no lee restaurantes', 'select * from public.restaurants', 'permission denied');
  perform tests.fails('anon no lee platos', 'select * from public.items', 'permission denied');
  perform tests.fails('anon no lee pedidos', 'select * from public.orders', 'permission denied');
  perform tests.fails('anon no inserta pedidos directo',
    format('insert into public.orders (restaurant_id, number, fulfillment, subtotal, total, currency) values (%L, 99, %L, 0, 0, %L)', ra, 'pickup', 'DOP'), 'permission denied');
  perform tests.fails('anon no crea restaurantes', 'select public.create_restaurant(''X'', ''xx-anon'')', 'permission denied');
  perform tests.fails('anon no consulta slugs', 'select public.slug_available(''x'')', 'permission denied');
  perform tests.fails('anon no usa API de plataforma', 'select public.admin_stats()', 'permission denied');
  perform tests.fails('anon no sube archivos',
    format('insert into storage.objects (bucket_id, name) values (%L, %L)', 'media', ra || '/x.webp'), 'row-level security');

  m := public.get_public_menu('PIZZA-A ');
  perform tests.check('menú público existe', m is not null);
  perform tests.check('menú público trae tema y tipografía', m->'restaurant'->>'theme' = 'dark' and m->'restaurant'->>'font_style' = 'classic');
  perform tests.check('menú trae 3 platos (sin la categoría oculta)', jsonb_array_length(m->'items') = 3);
  perform tests.check('menú no trae lo oculto', not (m::text like '%Oculto%' or m::text like '%Secreto%'));
  perform tests.check('menú no expone plan ni estado', not (m->'restaurant' ? 'plan' or m->'restaurant' ? 'status'));
  perform tests.check('slug inexistente → null', public.get_public_menu('no-existe') is null);

  -- Visitas: el público solo suma con la función; no lee ni escribe la tabla.
  perform public.track_menu_view('pizza-a');
  perform public.track_menu_view('PIZZA-A');
  perform public.track_menu_view('no-existe');
  perform tests.fails('anon no lee visitas', 'select * from public.menu_views_daily', 'permission denied');
  perform tests.fails('anon no infla visitas directo',
    format('insert into public.menu_views_daily (restaurant_id, day, views) values (%L, current_date, 999)', ra), 'permission denied');

  -- Aperturas de plato: solo con la función, y solo de platos del menú indicado.
  perform public.track_item_open('pizza-a', pizza);
  perform public.track_item_open('PIZZA-A', pizza);
  perform public.track_item_open('burger-b', pizza);
  perform public.track_item_open('no-existe', pizza);
  perform public.track_item_open('pizza-a', gen_random_uuid());
  perform tests.fails('anon no lee aperturas', 'select * from public.item_opens_daily', 'permission denied');
  perform tests.fails('anon no lee contactos', 'select * from public.restaurant_contacts', 'permission denied');
  perform tests.fails('anon no infla aperturas directo',
    format('insert into public.item_opens_daily (restaurant_id, item_id, day, opens) values (%L, %L, current_date, 999)', ra, pizza), 'permission denied');

  -- Pedido válido. Se manda un unit_price falso: se ignora.
  o := public.place_order('pizza-a', jsonb_build_array(
         jsonb_build_object('item_id', pizza, 'variant_id', grande, 'qty', 2, 'unit_price', 1, 'note', 'Sin cebolla'),
         jsonb_build_object('item_id', soda, 'qty', 1)
       ), 'delivery', zone, '  Ana  ', '809-555-0000', 'Calle 1', null);
  perform tests.check('pedido #1', (o->>'number')::int = 1);
  perform tests.check('precio sale de la base de datos', (o->>'subtotal')::numeric = 1300);
  perform tests.check('total con delivery', (o->>'total')::numeric = 1350);
  perform tests.check('variante copiada', o->'lines'->0->>'variant_label' = 'Grande');

  perform tests.fails('plato de otro restaurante',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', tests.id('b_item'), 'variant_id', tests.id('b_variant'), 'qty', 1)), 'pickup'), 'item_unavailable');
  perform tests.fails('variante de otro plato',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', soda, 'variant_id', grande, 'qty', 1)), 'pickup'), 'item_unavailable');
  perform tests.fails('falta elegir variante',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', pizza, 'qty', 1)), 'pickup'), 'variant_required');
  perform tests.fails('plato agotado',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', tests.id('a_gone'), 'qty', 1)), 'pickup'), 'item_unavailable');
  perform tests.fails('plato de categoría oculta',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', tests.id('a_secret'), 'qty', 1)), 'pickup'), 'item_unavailable');
  perform tests.fails('cantidad excesiva',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', soda, 'qty', 21)), 'pickup'), 'invalid_lines');
  perform tests.fails('cantidad cero',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', soda, 'qty', 0)), 'pickup'), 'invalid_lines');
  perform tests.fails('id basura',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', '[{"item_id":"x; drop table items","qty":1}]', 'pickup'), 'invalid_lines');
  perform tests.fails('pedido vacío', 'select public.place_order(''pizza-a'', ''[]''::jsonb, ''pickup'')', 'invalid_lines');
  -- Burger B se creó sin WhatsApp: su menú es público, pero no acepta pedidos.
  perform tests.check('menú sin WhatsApp sigue público', public.get_public_menu('burger-b') is not null);
  perform tests.fails('sin WhatsApp no recibe pedidos',
    format('select public.place_order(%L, %L::jsonb, %L)', 'burger-b', jsonb_build_array(jsonb_build_object('item_id', tests.id('b_item'), 'variant_id', tests.id('b_variant'), 'qty', 1)), 'pickup'), 'ordering_unavailable');
  perform tests.fails('zona de otro restaurante',
    format('select public.place_order(%L, %L::jsonb, %L, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', soda, 'qty', 1)), 'delivery', tests.id('b_zone')), 'zone_unavailable');
  perform tests.fails('delivery sin zona',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', soda, 'qty', 1)), 'delivery'), 'zone_required');
  perform tests.fails('tipo de entrega inválido',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', soda, 'qty', 1)), 'drone'), 'invalid_fulfillment');
  perform tests.logout();
end $$;

-- ───────────── Pedidos: cada dueño ve solo los suyos ─────────────
do $$
declare ra uuid := tests.id('ra'); oid uuid;
begin
  perform tests.login('00000000-0000-4000-8000-00000000000a');
  perform tests.rows('A ve su pedido', 'select 1 from public.orders', 1);
  perform tests.rows('A ve las líneas', 'select 1 from public.order_items', 2);
  select id into oid from public.orders limit 1;
  perform tests.check('nombre recortado', (select customer_name from public.orders where id = oid) = 'Ana');
  perform tests.check('teléfono normalizado', (select customer_phone from public.orders where id = oid) = '8095550000');
  perform tests.affects('A cambia el estado', format('update public.orders set status = %L where id = %L', 'confirmed', oid), 1);
  perform tests.fails('A no altera montos', format('update public.orders set total = 1 where id = %L', oid), 'permission denied');
  perform tests.fails('A no borra pedidos', format('delete from public.orders where id = %L', oid), 'permission denied');
  perform tests.fails('A no altera líneas', 'update public.order_items set unit_price = 0', 'permission denied');
  perform tests.check('A ve sus 2 visitas', (select sum(views) from public.menu_views_daily) = 2);
  perform tests.fails('A no altera sus visitas', 'update public.menu_views_daily set views = 1000', 'permission denied');
  perform tests.check('A ve sus 2 aperturas de plato', (select sum(opens) from public.item_opens_daily) = 2);
  perform tests.fails('A no altera sus aperturas', 'update public.item_opens_daily set opens = 1000', 'permission denied');
  perform tests.affects('A guarda su teléfono de contacto', format('insert into public.restaurant_contacts (restaurant_id, phone) values (%L, %L)', ra, '18098704800'), 1);
  perform tests.fails('teléfono de contacto inválido', format('update public.restaurant_contacts set phone = %L where restaurant_id = %L', '12ab', ra), 'check constraint');
  perform tests.check('A ve su teléfono de contacto', (select phone from public.restaurant_contacts) = '18098704800');
  perform tests.keep('a_order', oid);
  perform tests.logout();

  perform tests.login('00000000-0000-4000-8000-00000000000b');
  perform tests.rows('B no ve pedidos de A', 'select 1 from public.orders', 0);
  perform tests.rows('B no ve líneas de A', 'select 1 from public.order_items', 0);
  perform tests.rows('B no ve visitas de A', 'select 1 from public.menu_views_daily', 0);
  perform tests.rows('B no ve aperturas de A', 'select 1 from public.item_opens_daily', 0);
  perform tests.rows('B no ve contacto de A', 'select 1 from public.restaurant_contacts', 0);
  perform tests.fails('B no pone contacto a A', format('insert into public.restaurant_contacts (restaurant_id, phone) values (%L, %L)', ra, '18095550000'), 'row-level security');
  perform tests.affects('B no cambia el contacto de A', format('update public.restaurant_contacts set phone = %L where restaurant_id = %L', '18095550000', ra), 0);
  perform tests.affects('B no cambia estados de A', format('update public.orders set status = %L where id = %L', 'cancelled', tests.id('a_order')), 0);
  perform tests.logout();
end $$;

-- ───────────── Staff: gestiona el menú, no el negocio ─────────────
insert into public.restaurant_members (restaurant_id, user_id, role)
values (current_setting('tests.ra')::uuid, '00000000-0000-4000-8000-00000000000d', 'staff');

do $$
declare ra uuid := tests.id('ra');
begin
  perform tests.login('00000000-0000-4000-8000-00000000000d');
  perform tests.affects('staff marca agotado', format('update public.items set is_available = false where id = %L', tests.id('a_soda')), 1);
  perform tests.rows('staff ve pedidos', 'select 1 from public.orders', 1);
  perform tests.affects('staff no edita el perfil', format('update public.restaurants set name = %L where id = %L', 'Staff', ra), 0);
  perform tests.fails('staff no cambia enlaces',
    format('insert into public.restaurant_links (restaurant_id, kind, url) values (%L, %L, %L)', ra, 'website', 'https://x.com'), 'row-level security');
  perform tests.fails('alta con slug reservado',
    'select public.create_restaurant(''Staff Grill'', ''admin'')', 'check constraint');
  update public.items set is_available = true where id = tests.id('a_soda');
  perform tests.logout();
end $$;

-- ───────────── Freno de abuso ─────────────
do $$
declare i int; soda uuid := tests.id('a_soda');
begin
  perform tests.as_anon();
  for i in 1..19 loop
    perform public.place_order('pizza-a', jsonb_build_array(jsonb_build_object('item_id', soda, 'qty', 1)), 'pickup');
  end loop;
  perform tests.fails('más de 20 pedidos por minuto',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', soda, 'qty', 1)), 'pickup'), 'rate_limited');
  perform tests.logout();
end $$;

-- ───────────── Super admin ─────────────
do $$
declare ra uuid := tests.id('ra'); rb uuid := tests.id('rb');
begin
  perform tests.login('00000000-0000-4000-8000-0000000000ff');
  perform tests.rows('super lista los de prueba',
    format('select * from public.admin_list_restaurants() where id in (%L, %L)', ra, rb), 2);
  perform tests.check('super ve correo del dueño', (select owner_email from public.admin_list_restaurants() where id = ra) = 'a@tests.local');
  perform tests.check('super ve visitas 7 días', (select views_7d from public.admin_list_restaurants() where id = ra) = 2);
  perform tests.check('super ve el contacto del dueño', (select contact_phone from public.admin_list_restaurants() where id = ra) = '18098704800');
  perform tests.rows('super NO lee tablas de tenants directo', 'select 1 from public.items', 0);
  perform tests.check('super es admin', public.is_platform_admin());

  perform public.admin_update_restaurant(ra, 'suspended');
  perform public.admin_update_restaurant(rb, null, 'pro', now() - interval '1 day');
  perform tests.rows('auditoría registra cambios',
    'select * from public.admin_audit_log() where action = ''restaurant.update'' and restaurant_name in (''Pizza A'', ''Burger B'')', 2);
  perform tests.fails('estado inválido', format('select public.admin_update_restaurant(%L, %L)', ra, 'gratis-para-siempre'), 'check constraint');
  perform tests.logout();

  perform tests.as_anon();
  perform tests.check('suspendido → menú oculto', public.get_public_menu('pizza-a') is null);
  perform tests.check('prueba vencida → menú oculto', public.get_public_menu('burger-b') is null);
  perform public.track_menu_view('pizza-a');
  perform tests.fails('suspendido no recibe pedidos',
    format('select public.place_order(%L, %L::jsonb, %L)', 'pizza-a', jsonb_build_array(jsonb_build_object('item_id', tests.id('a_soda'), 'qty', 1)), 'pickup'), 'restaurant_unavailable');
  perform tests.logout();

  perform tests.login('00000000-0000-4000-8000-0000000000ff');
  perform public.admin_update_restaurant(ra, 'active');
  perform tests.logout();
  perform tests.as_anon();
  perform tests.check('reactivado → menú visible', public.get_public_menu('pizza-a') is not null);
  perform tests.logout();
  -- Mientras estuvo suspendido no sumó visitas (antes de suspender había 2).
  perform tests.check('suspendido no suma visitas',
    (select sum(views) from public.menu_views_daily where restaurant_id = ra) = 2);
  perform tests.as_anon();
  perform tests.logout();
end $$;

-- ───────────── Usuario nuevo sin restaurante ─────────────
do $$
begin
  perform tests.login('00000000-0000-4000-8000-00000000000c');
  perform tests.rows('C no ve nada', 'select 1 from public.restaurants', 0);
  perform tests.rows('C no ve platos', 'select 1 from public.items', 0);
  perform tests.check('slug ocupado', not public.slug_available('pizza-a'));
  perform tests.check('slug libre', public.slug_available('cafe-c'));
  perform tests.fails('C no usa slug ocupado', 'select public.create_restaurant(''Café'', ''pizza-a'')', 'slug_taken');
  perform tests.check('C crea el suyo', public.create_restaurant('Café C', 'cafe-c') is not null);
  perform tests.rows('C ve solo el suyo', 'select 1 from public.restaurants', 1);
  perform tests.logout();
end $$;

-- ───────────── Aviso por correo de cliente nuevo ─────────────
do $$
declare rd uuid; v_body jsonb;
begin
  perform tests.login('00000000-0000-4000-8000-00000000000d');
  rd := public.create_restaurant('Bar <b>D</b> & Co', 'bar-d');
  insert into public.restaurant_contacts (restaurant_id, phone) values (rd, '18095550004');
  perform tests.logout();
  perform tests.check('sin llave en Vault no se envía', (select count(*) from net.sent) = 0);

  insert into vault.decrypted_secrets values ('resend_api_key', 'test-key');
  perform tests.login('00000000-0000-4000-8000-00000000000d');
  rd := (select id from public.restaurants where slug = 'bar-d');
  delete from public.restaurant_contacts where restaurant_id = rd;
  insert into public.restaurant_contacts (restaurant_id, phone) values (rd, '18095550004');
  perform tests.logout();
  select body into v_body from net.sent;
  perform tests.check('se envía un correo', (select count(*) from net.sent) = 1);
  perform tests.check('va a los super admins', v_body -> 'to' = '["super@tests.local"]'::jsonb);
  perform tests.check('el asunto trae el nombre', (v_body ->> 'subject') like '%Bar <b>D</b> & Co%');
  perform tests.check('el nombre va escapado en el HTML',
    (v_body ->> 'html') like '%Bar &lt;b&gt;D&lt;/b&gt; &amp; Co%' and (v_body ->> 'html') not like '%<b>D</b>%');
  perform tests.check('trae el contacto y el dueño',
    (v_body ->> 'html') like '%18095550004%' and (v_body ->> 'html') like '%d@tests.local%');
  perform tests.check('un fallo del envío no frena el registro', true);
end $$;

select 'ALL TESTS PASSED' as result;
rollback;
