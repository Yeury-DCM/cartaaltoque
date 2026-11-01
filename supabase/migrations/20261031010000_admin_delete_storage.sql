-- Corrige admin_delete_restaurant: Supabase no permite borrar filas de storage.objects desde
-- SQL (hay que usar la API de Storage). La función ya no toca archivos; el panel los borra con
-- la API, y para eso el super admin recibe permiso de ver y borrar en el bucket de imágenes.

create or replace function public.admin_delete_restaurant(p_id uuid, p_confirm_slug text)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_name text; v_slug text; v_owner text;
begin
  perform private.require_super_admin();
  select r.name, r.slug into v_name, v_slug from public.restaurants r where r.id = p_id;
  if v_slug is null then
    raise exception 'not_found';
  end if;
  if p_confirm_slug is distinct from v_slug then
    raise exception 'confirm_mismatch';
  end if;

  select u.email::text into v_owner
  from public.restaurant_members m join auth.users u on u.id = m.user_id
  where m.restaurant_id = p_id and m.role = 'owner' order by m.created_at limit 1;

  -- Las categorías están protegidas contra borrado mientras tengan platos: se borran en orden.
  delete from public.items where restaurant_id = p_id;
  delete from public.categories where restaurant_id = p_id;
  delete from public.restaurants where id = p_id;

  perform private.audit('restaurant.delete', p_id,
    jsonb_build_object('name', v_name, 'slug', v_slug, 'owner_email', v_owner));
end $$;

drop policy if exists "super admin read media" on storage.objects;
create policy "super admin read media" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select private.is_super_admin()));

drop policy if exists "super admin delete media" on storage.objects;
create policy "super admin delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select private.is_super_admin()));
