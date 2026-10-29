-- El color por defecto de un restaurante nuevo pasa al naranja del logo oficial (#FF7101).
-- Los restaurantes que ya existen conservan el suyo.
alter table public.restaurants alter column brand_color set default '#FF7101';
