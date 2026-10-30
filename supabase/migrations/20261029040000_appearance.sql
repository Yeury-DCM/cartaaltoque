-- Personalización del menú público: tema (claro u oscuro) y estilo de letra.
-- El dueño los cambia como el resto de su perfil (permiso por columna); el menú público
-- los recibe por get_public_menu.
alter table public.restaurants
  add column if not exists theme      text not null default 'dark'    check (theme in ('dark', 'light')),
  add column if not exists font_style text not null default 'classic' check (font_style in ('classic', 'elegant', 'modern', 'bold'));

grant update (theme, font_style) on public.restaurants to authenticated;

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
      'hours', r.hours, 'currency', r.currency,
      'theme', r.theme, 'font_style', r.font_style
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

revoke all on function public.get_public_menu(text) from public, anon, authenticated;
grant execute on function public.get_public_menu(text) to anon, authenticated;
