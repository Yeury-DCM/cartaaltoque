-- ════════════════════════════════════════════════════════════════════════════
-- Aviso por correo a los super admins cada vez que un restaurante se registra.
-- Se dispara cuando se guarda por primera vez su teléfono de contacto (último paso del
-- onboarding), así el correo ya trae todo para darle seguimiento.
-- Envía con la API de Resend vía pg_net. La llave NO está en el código: vive en Vault
-- (secreto "resend_api_key"). Si falta o el envío falla, el registro sigue normal.
-- ════════════════════════════════════════════════════════════════════════════

do $$
begin
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_net no disponible (%): el aviso por correo no se enviará aquí', sqlerrm;
end $$;

create or replace function private.html_esc(t text)
returns text language sql immutable set search_path = '' as $$
  select replace(replace(replace(replace(replace(coalesce(t, ''),
    '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;')
$$;

create or replace function private.notify_new_restaurant()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_key       text;
  v_to        text[];
  v_name      text;
  v_slug      text;
  v_order_wa  text;
  v_trial     timestamptz;
  v_owner     text;
  v_total     bigint;
  v_wa_link   text;
  v_html      text;
  v_row       text;
begin
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key';
  if v_key is null then return new; end if;

  select array_agg(u.email::text) into v_to
  from private.platform_admins a join auth.users u on u.id = a.user_id
  where u.email is not null;
  if v_to is null then return new; end if;

  select r.name, r.slug, r.whatsapp, r.trial_ends_at into v_name, v_slug, v_order_wa, v_trial
  from public.restaurants r where r.id = new.restaurant_id;

  select u.email::text into v_owner
  from public.restaurant_members m join auth.users u on u.id = m.user_id
  where m.restaurant_id = new.restaurant_id and m.role = 'owner'
  order by m.created_at limit 1;

  select count(*) into v_total from public.restaurants;

  v_wa_link := 'https://wa.me/' || new.phone
    || '?text=Hola%2C%20vi%20que%20creaste%20tu%20men%C3%BA%20en%20Carta%20al%20Toque.%20%C2%BFTe%20ayudo%20a%20dejarlo%20listo%3F';

  v_row := '<tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#888;width:42%%">%s</td>'
        || '<td style="padding:10px 0;border-bottom:1px solid #eee;font-size:15px;font-weight:bold;color:#1a1a1a">%s</td></tr>';

  v_html :=
    '<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#f3f1ee;">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f1ee;padding:32px 12px;"><tr><td align="center">'
    || '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">'
    || '<tr><td align="center" style="background:#0D0D0D;padding:30px 24px;border-bottom:4px solid #FF7101;">'
    || '<div style="font-size:44px;line-height:1">🎉🚀🎉</div>'
    || '<div style="margin-top:10px;font-family:Impact,''Arial Narrow Bold'',sans-serif;font-size:34px;line-height:1.05;letter-spacing:1px;color:#ffffff;text-transform:uppercase;">¡Cliente nuevo <span style="color:#FF7101;">en la casa!</span></div>'
    || '</td></tr>'
    || '<tr><td style="padding:30px 32px 8px;color:#3a3a3a;font-size:16px;line-height:1.6;">'
    || '<p style="margin:0 0 6px"><strong style="color:#1a1a1a">¡Se registró un restaurante!</strong> 🥳 Ya es el cliente número <strong style="color:#FF7101">' || v_total || '</strong>. Escríbele hoy mismo: el que recibe respuesta rápido, se queda.</p>'
    || '</td></tr>'
    || '<tr><td style="padding:8px 32px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
    || format(v_row, 'Restaurante', private.html_esc(v_name))
    || format(v_row, 'Su menú', '<a href="https://cartaaltoque.com/r/' || private.html_esc(v_slug) || '" style="color:#FF7101;text-decoration:none">cartaaltoque.com/r/' || private.html_esc(v_slug) || '</a>')
    || format(v_row, 'Correo de la cuenta', private.html_esc(v_owner))
    || format(v_row, 'WhatsApp de contacto', '<a href="' || v_wa_link || '" style="color:#FF7101;text-decoration:none">+' || private.html_esc(new.phone) || '</a>')
    || format(v_row, 'WhatsApp de pedidos', case when v_order_wa is null then 'No puso (menú sin carrito)' else '+' || private.html_esc(v_order_wa) end)
    || format(v_row, 'Prueba gratis hasta', coalesce(to_char(v_trial at time zone 'America/Santo_Domingo', 'DD/MM/YYYY'), '—'))
    || '</table></td></tr>'
    || '<tr><td align="center" style="padding:24px 32px 8px;">'
    || '<a href="' || v_wa_link || '" style="display:inline-block;background:#FF7101;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 28px;border-radius:999px;">Escribirle por WhatsApp 💬</a>'
    || '</td></tr>'
    || '<tr><td style="padding:22px 32px 6px;color:#3a3a3a;font-size:15px;line-height:1.6;">'
    || '<strong style="color:#1a1a1a">Para darle seguimiento:</strong>'
    || '<ol style="margin:8px 0 0;padding-left:20px">'
    || '<li>Salúdalo hoy y ofrécele ayuda para cargar sus primeros platos.</li>'
    || '<li>Revisa su menú y dile qué se ve genial (y qué le falta).</li>'
    || '<li>Antes de que termine la prueba, coordina el plan y el pago.</li>'
    || '</ol></td></tr>'
    || '<tr><td align="center" style="padding:24px 32px 30px;font-size:13px;color:#999;">Todo está en tu <a href="https://cartaaltoque.com/app" style="color:#FF7101">panel</a>. ¡A vender! 💪</td></tr>'
    || '</table></td></tr></table></body></html>';

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := jsonb_build_object(
      'from',    'Carta al Toque <hola@cartaaltoque.com>',
      'to',      to_jsonb(v_to),
      'subject', '🎉 ¡Cliente nuevo! ' || v_name || ' se acaba de registrar',
      'html',    v_html
    )
  );
  return new;
exception when others then
  -- Un fallo del aviso nunca debe impedir que el restaurante se registre.
  raise warning 'notify_new_restaurant: %', sqlerrm;
  return new;
end $$;

revoke all on function private.notify_new_restaurant() from public, anon, authenticated;
revoke all on function private.html_esc(text) from public, anon, authenticated;

drop trigger if exists notify_new_restaurant on public.restaurant_contacts;
create trigger notify_new_restaurant
  after insert on public.restaurant_contacts
  for each row execute function private.notify_new_restaurant();
