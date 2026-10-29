-- Restaurante de demostración (/r/demo) para la landing y para probar.
-- Se puede correr de nuevo: borra el demo anterior (y todo lo suyo) y lo vuelve a crear.
-- No tiene dueño: lo administra la plataforma. El WhatsApp es ficticio.
begin;

delete from public.restaurants where slug = 'demo';

with r as (
  insert into public.restaurants (
    slug, name, tagline, description, brand_color, whatsapp, address, hours, status, plan
  ) values (
    'demo', 'Pizzería Don Juan', 'Pizzas al horno de leña y burgers de la casa',
    'Restaurante de demostración de Carta al Toque. Arma tu pedido y mira cómo llega por WhatsApp.',
    '#F5A01E', '18090000000', 'Av. Ejemplo 123, Santo Domingo', 'Lun–Dom · 12 pm – 11 pm',
    'active', 'basic'
  ) returning id
),
cats as (
  insert into public.categories (restaurant_id, name, sort_order)
  select r.id, c.name, c.ord from r, (values ('Pizzas', 1), ('Burgers', 2), ('Bebidas', 3)) as c(name, ord)
  returning id, name, restaurant_id
),
items as (
  insert into public.items (restaurant_id, category_id, name, description, price, sort_order)
  select c.restaurant_id, c.id, i.name, i.descr, i.price, i.ord
  from cats c
  join (values
    ('Pizzas', 'Margarita', 'Salsa de tomate, mozzarella y albahaca fresca.', 450, 1),
    ('Pizzas', 'Pepperoni', 'Mozzarella y pepperoni crujiente.', 550, 2),
    ('Pizzas', 'Don Juan', 'La de la casa: jamón, maíz, cebolla caramelizada y queso.', 650, 3),
    ('Burgers', 'Clásica', 'Carne de res, queso cheddar, lechuga y tomate.', 350, 1),
    ('Burgers', 'Doble queso', 'Doble carne, doble cheddar y salsa de la casa.', 450, 2),
    ('Bebidas', 'Limonada frozen', 'Limón natural, bien fría.', 150, 1),
    ('Bebidas', 'Refresco', 'Lata de 355 ml.', 80, 2)
  ) as i(cat, name, descr, price, ord) on i.cat = c.name
  returning id, name, restaurant_id
)
insert into public.item_variants (restaurant_id, item_id, label, price, sort_order)
select it.restaurant_id, it.id, v.label, v.price, v.ord
from items it
join (values
  ('Margarita', 'Personal', 450, 1), ('Margarita', 'Grande', 850, 2),
  ('Pepperoni', 'Personal', 550, 1), ('Pepperoni', 'Grande', 990, 2),
  ('Don Juan', 'Personal', 650, 1), ('Don Juan', 'Grande', 1150, 2),
  ('Clásica', 'Sola', 350, 1), ('Clásica', 'Con papas', 450, 2)
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
