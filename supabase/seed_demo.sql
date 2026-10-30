-- Restaurante de demostración (/r/demo) para la landing y para probar.
-- Se puede correr de nuevo: borra el demo anterior (y todo lo suyo) y lo vuelve a crear.
-- No tiene dueño: lo administra la plataforma. El WhatsApp es ficticio.
begin;

delete from public.restaurants where slug = 'demo';

with r as (
  insert into public.restaurants (
    slug, name, tagline, description, brand_color, whatsapp, address, hours, status, plan
  ) values (
    'demo', 'La Terraza', 'Parrilla criolla y platos para compartir',
    'Restaurante de demostración de Carta al Toque. Arma tu pedido y mira cómo llega por WhatsApp.',
    '#FF7101', '18090000000', 'Av. Ejemplo 123, Santo Domingo', 'Lun–Dom · 12 pm – 11 pm',
    'active', 'basic'
  ) returning id
),
cats as (
  insert into public.categories (restaurant_id, name, sort_order)
  select r.id, c.name, c.ord from r, (values ('Entradas', 1), ('Platos fuertes', 2), ('Bebidas', 3)) as c(name, ord)
  returning id, name, restaurant_id
),
items as (
  insert into public.items (restaurant_id, category_id, name, description, price, sort_order)
  select c.restaurant_id, c.id, i.name, i.descr, i.price, i.ord
  from cats c
  join (values
    ('Entradas', 'Tostones', 'Dorados y crujientes, con salsa rosada.', 250, 1),
    ('Entradas', 'Yuquitas de queso', 'Rellenas de queso, con dip de ajo.', 280, 2),
    ('Platos fuertes', 'Costillas BBQ', 'Media tabla glaseada en salsa BBQ.', 850, 1),
    ('Platos fuertes', 'Pollo a la parrilla', 'Pechuga marinada, arroz y ensalada.', 550, 2),
    ('Platos fuertes', 'Hamburguesa de la casa', 'Res, cheddar, tocino y papas.', 450, 3),
    ('Bebidas', 'Limonada frozen', 'Limón natural, bien fría.', 150, 1),
    ('Bebidas', 'Refresco', 'Lata de 355 ml.', 80, 2)
  ) as i(cat, name, descr, price, ord) on i.cat = c.name
  returning id, name, restaurant_id
)
insert into public.item_variants (restaurant_id, item_id, label, price, sort_order)
select it.restaurant_id, it.id, v.label, v.price, v.ord
from items it
join (values
  ('Costillas BBQ', 'Media tabla', 850, 1), ('Costillas BBQ', 'Tabla completa', 1500, 2),
  ('Hamburguesa de la casa', 'Sola', 450, 1), ('Hamburguesa de la casa', 'Con papas', 550, 2)
) as v(item, label, price, ord) on v.item = it.name;

insert into public.delivery_zones (restaurant_id, name, neighborhoods, fee, sort_order)
select r.id, z.name, z.hoods, z.fee, z.ord
from public.restaurants r, (values
  ('Zona 1', array['Piantini', 'Naco', 'Evaristo Morales'], 100, 1),
  ('Zona 2', array['Bella Vista', 'Gazcue', 'Mirador Norte'], 150, 2)
) as z(name, hoods, fee, ord)
where r.slug = 'demo';

insert into public.restaurant_links (restaurant_id, kind, url, sort_order)
select r.id, l.kind, l.url, l.ord
from public.restaurants r, (values
  ('instagram', 'https://instagram.com/', 1),
  ('maps', 'https://maps.google.com/', 2)
) as l(kind, url, ord)
where r.slug = 'demo';

commit;
