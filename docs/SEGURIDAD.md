# Seguridad multi-tenant

Principio: **el aislamiento entre restaurantes lo garantiza la base de datos**, no el
frontend. Aunque alguien use la API de Supabase directamente con la llave pública, no
puede ver ni tocar datos de otro restaurante.

## Capas

1. **RLS en todas las tablas.** Cada fila lleva `restaurant_id`. Las políticas solo
   dejan ver y escribir filas de restaurantes donde el usuario es miembro
   (`private.my_restaurants()`); el perfil y los enlaces, solo el dueño
   (`private.owned_restaurants()`).
2. **Claves foráneas compuestas** `(id, restaurant_id)`. Un plato no puede usar la
   categoría de otro restaurante, ni una variante colgar de un plato ajeno, aunque
   alguien adivine los UUID.
3. **Permisos por columna.** El dueño puede editar su perfil, pero **no** `plan`,
   `status` ni `trial_ends_at`. De un pedido solo puede cambiar `status`, nunca montos.
4. **Membresías cerradas.** No hay permiso para insertar en `restaurant_members` desde
   el cliente: solo `create_restaurant()` crea al dueño. Nadie puede "unirse" a otro
   restaurante.
5. **El público no tiene acceso a tablas.** `anon` solo puede llamar:
   - `get_public_menu(slug)`: devuelve el menú visible (sin plan ni estado), o `null` si
     no existe, está suspendido, despublicado o con la prueba vencida.
   - `place_order(...)`: recibe solo *qué* platos y *cuántos*. Precios, nombres,
     variantes y costo de entrega salen de la base de datos. Valida que todo sea del
     mismo restaurante, que esté disponible, cantidades de 1 a 20, máximo 50 líneas y
     máximo 20 pedidos por minuto por restaurante.
6. **Super admin sin acceso directo.** No hay políticas que le abran las tablas: todo pasa
   por funciones `admin_*` que verifican el rol (`private.platform_admins`, fuera de la API)
   y dejan registro en `private.audit_log`.
7. **Storage por carpeta.** Bucket `media`: cada restaurante solo escribe en
   `{restaurant_id}/…`. Las rutas guardadas en la base de datos también se validan con
   `CHECK` (no pueden apuntar a otra carpeta ni usar `..`).
8. **Entradas peligrosas bloqueadas en la base de datos:** enlaces solo `https://` (sin
   `javascript:`), color de marca solo `#RRGGBB` (no se puede inyectar CSS), slug con
   formato fijo y palabras reservadas, longitudes máximas en todos los textos.
9. **Cabeceras:** CSP, `X-Frame-Options: DENY`, HSTS; `/app` y `/super` con `no-store`
   y `noindex`.

## Pruebas

`supabase/tests/rls_test.sql` simula dos restaurantes, un staff, un anónimo, un usuario
nuevo y un super admin, e intenta: leer y modificar datos ajenos, colarse como miembro,
cambiarse el plan, subir archivos a otra carpeta, manipular precios en un pedido,
pedir platos de otro restaurante u ocultos, saltarse el límite de pedidos, y usar las
funciones de super admin sin serlo. También se verificó que las pruebas fallan si se
abre a propósito cada uno de esos huecos.

Corre con `bun run test:db` (local) o pegando el archivo en el SQL Editor de Supabase.

## Pendiente antes de producción

- **Captcha (Cloudflare Turnstile)** en registro y, si hay abuso, en `place_order`.
- Confirmación de correo activada en Supabase Auth (viene así por defecto).
- Política de privacidad: los pedidos guardan nombre, teléfono y dirección del cliente.
- Backups automáticos (plan Pro de Supabase).
