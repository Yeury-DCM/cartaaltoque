# Carta al Toque — cartaaltoque.com

SaaS multi-tenant de menú digital: cada restaurante arma su menú, genera su QR y
recibe los pedidos armados por WhatsApp. Nació del código de Chambra Food Truck,
pero es un proyecto independiente.

> El nombre y el dominio viven en `src/lib/brand.ts` (`APP_NAME`, `APP_DOMAIN`).

## Rutas

| Ruta | Quién | Qué es |
|---|---|---|
| `/` | Público | Landing del SaaS |
| `/entrar` | Público | Entrar, crear cuenta, recuperar contraseña |
| `/r/:slug` | Público | Menú de un restaurante (lo que abre el QR) |
| `/app` | Dueño / staff | Panel: inicio (visitas), menú, mi página, QR, zonas |
| `/super` | Super admin | Restaurantes, planes, estados, auditoría |

## Stack

TanStack Start + React + Tailwind · Supabase (Postgres, Auth, Storage) · Cloudflare.
Las dependencias se instalan con **bun** (`bun install`): el `bun.lockb` fija las
versiones de TanStack que funcionan juntas.

## Puesta en marcha

1. **Crear un proyecto nuevo en Supabase** (aparte del de Chambra).
2. **Base de datos:** en SQL Editor, pegar y correr
   `supabase/migrations/20261029000000_init.sql`. Se puede correr de nuevo sin romper nada.
3. **Probar la seguridad:** pegar y correr `supabase/tests/rls_test.sql`. Debe responder
   `ALL TESTS PASSED` (no deja datos: termina en `ROLLBACK`).
4. **Auth → URL Configuration:** Site URL = tu dominio; en Redirect URLs agregar
   `https://tudominio.com/app` y `https://tudominio.com/entrar` (y `http://localhost:8080/*` para desarrollo).
5. **Variables:** copiar `.env.example` a `.env.local` y llenar URL y publishable key.
6. `bun install` y `bun run dev` → http://localhost:8080
7. **Hacerte super admin:** crea tu cuenta en `/entrar` y corre en SQL Editor:
   ```sql
   insert into private.platform_admins (user_id)
   select id from auth.users where email = 'TU_CORREO' on conflict do nothing;
   ```
8. **Restaurante demo (opcional):** correr `supabase/seed_demo.sql` → `/r/demo`.

Proyecto Supabase actual: `cartaaltoque` (ref `ghptqhnhhazaufcchzsw`, us-west-2).

## Pruebas

```bash
bun run test:db
```

Levanta un Postgres en memoria (PGlite), aplica la migración dos veces y corre las
pruebas de aislamiento entre restaurantes. Ver `docs/SEGURIDAD.md`.

## Planes

Hoy todos los restaurantes usan el plan Básico: menú, QR, pedido por WhatsApp y zonas.
Los pedidos se guardan solo para numerarlos (#12 en el mensaje) y contarlos; el producto
no gestiona pedidos: el negocio los atiende por WhatsApp.
El plan y el estado de cada restaurante solo los cambia el super admin.
