# Inmobiliaria · Sistema de compra y venta de casas y terrenos

Aplicación web con **panel público** (mapa de propiedades y reserva de visitas) y **panel de administración** (dashboard, propiedades, embudo de ventas, citas y cartera de clientes).

- **Frontend:** React + Vite + TypeScript, Tailwind CSS, Recharts, React-Leaflet + OpenStreetMap, lucide-react, React Router, zod.
- **Backend:** Supabase (Postgres, Auth, Storage, RLS, funciones RPC, Edge Functions, pg_cron + pg_net, Realtime).
- **Despliegue:** Vercel.
- Interfaz en español · moneda USD · zona horaria America/Guayaquil.

## Estructura

```
src/                         Frontend
  components/                Componentes base, layout, gráficos, mapa y fotos
  pages/admin/               Login, dashboard, propiedades, embudo, citas, clientes
  pages/publico/             Mapa, ficha de la propiedad y reserva
  lib/                       Cliente de Supabase, tipos generados y utilidades
supabase/
  migrations/                Esquema SQL (13 tablas), RLS, funciones y cron
  functions/enviar-whatsapp/ Edge Function de WhatsApp
  seed.sql                   Datos de prueba de Quito, Ambato e Ibarra
docs/diseno/                 Imágenes de referencia
vercel.json                  Rewrite de todas las rutas a index.html
```

### Migraciones

| Archivo | Contenido |
|---|---|
| `…0001_esquema.sql` | Las 13 tablas con PK, FK, CHECK, UNIQUE y NOT NULL, índices y catálogos fijos |
| `…0002_seguridad_rls.sql` | `es_admin()`, RLS en todas las tablas, bucket `fotos-propiedades` y Realtime en `cita` |
| `…0003_funciones.sql` | Triggers del embudo, `agendar_visita()`, `horarios_ocupados()`, funciones del dashboard y vistas |
| `…0004_guardar_propiedad.sql` | `guardar_propiedad()`: propiedad + servicios + avalúo en una transacción |
| `…0005_recordatorios_whatsapp.sql` | `programar_recordatorios()` y el job de pg_cron cada 15 minutos |

## Requisitos

- Node.js 20 o superior.
- Una cuenta en [supabase.com](https://supabase.com) y otra en [vercel.com](https://vercel.com).
- La Supabase CLI se usa con `npx supabase …` (no hace falta instalarla). No se necesita Docker.

## 1. Crear el proyecto en Supabase y vincularlo

1. En supabase.com crea un proyecto nuevo (plan Free, región East US) y guarda la contraseña de la base.
2. En **Project Settings → API** copia la **Project URL** y la **anon / publishable key**.
3. En la carpeta del proyecto:

```bash
npx supabase login
```

```bash
npx supabase link --project-ref TU_PROJECT_REF
```

`TU_PROJECT_REF` son las letras de la URL antes de `.supabase.co`. Te pedirá la contraseña de la base.

## 2. Aplicar las migraciones y el seed

```bash
npx supabase db push --remote --include-seed
```

Esto crea las 13 tablas, la seguridad, las funciones, el bucket de fotos y carga los datos de prueba.

## 3. Bucket de fotos y primer usuario admin

El bucket `fotos-propiedades` lo crea la migración 2 (lectura pública, escritura solo para admins). Puedes verlo en **Storage**.

Para crear el primer administrador:

1. En **Authentication → Users → Add user → Create new user**, escribe correo y contraseña y marca **Auto Confirm User**.
2. En **SQL Editor** ejecuta, con tu correo:

```sql
insert into public.usuario_admin (usuario, nombre, apellido, correo, auth_user_id, rol)
select 'admin', 'Nombre', 'Apellido', u.email, u.id, 'administrador'
from auth.users u
where u.email = 'tu@correo.com';
```

No se guardan contraseñas en `usuario_admin`: el login lo maneja Supabase Auth. Si una cuenta inicia sesión pero no está en esta tabla, la app muestra "Acceso denegado".

## 4. Edge Function de WhatsApp

```bash
npx supabase functions deploy enviar-whatsapp --no-verify-jwt
```

Por defecto funciona en **modo simulado**: registra el mensaje en los logs de la función y lo marca como `enviado`.

Para enviar mensajes reales con la **Twilio WhatsApp API**, configura sus secrets y vuelve a desplegar:

```bash
npx supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxx TWILIO_AUTH_TOKEN=xxxxxxxx TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

Los secretos de Twilio solo viven en la Edge Function; nunca van al frontend. El teléfono del cliente se convierte a formato internacional (`+593` + número sin el 0).

> La función no exige JWT porque la llaman el formulario público y pg_net. Solo envía mensajes que ya están guardados en la base, así que no permite mandar texto arbitrario.

## 5. Recordatorios: pg_cron y pg_net

La migración 5 activa las extensiones `pg_cron` y `pg_net` y programa el job `recordatorios-whatsapp` cada 15 minutos. El job:

1. Busca las citas `agendada` que empiezan en las próximas 24 horas y aún no tienen recordatorio.
2. Inserta su notificación como `pendiente`.
3. Llama a la Edge Function con pg_net (también reintenta las confirmaciones pendientes).

Falta un único paso manual: guardar la URL de la función en **Vault**. En **SQL Editor**:

```sql
select vault.create_secret(
  'https://TU_PROJECT_REF.supabase.co/functions/v1/enviar-whatsapp',
  'url_enviar_whatsapp'
);
```

Si las extensiones no se activaran solas, hazlo en **Database → Extensions** buscando `pg_cron` y `pg_net`. Para revisar el job: `select * from cron.job;` y sus ejecuciones en `cron.job_run_details`.

## 6. Desarrollo local

```bash
npm install
```

Copia `.env.example` como `.env.local` y completa los valores del paso 1:

```
VITE_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

```bash
npm run dev
```

- Panel público: http://localhost:5173/
- Panel admin: http://localhost:5173/admin

Para regenerar los tipos de TypeScript después de cambiar la base:

```bash
npx supabase gen types typescript --linked > src/lib/database.types.ts
```

## 7. Desplegar en Vercel

1. Sube el repositorio a GitHub.
2. En vercel.com pulsa **Add New → Project** e importa el repositorio. Vercel detecta Vite.
3. En **Environment Variables** agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Pulsa **Deploy**.

`vercel.json` redirige todas las rutas a `index.html` para que React Router funcione al recargar.

**Nunca** pongas la `service_role` key en Vercel ni en el frontend: la seguridad la aplican las políticas RLS.

## Seguridad (resumen)

- RLS activado en las 13 tablas.
- El público (rol `anon`) solo lee propiedades `disponible` y sus fotos, servicios, avalúos, tipos y sectores.
- El público no puede leer ni escribir `cliente`, `interes`, `cita`, `notificacion_whatsapp`, `seguimiento_cliente` ni `usuario_admin`. Agenda visitas solo a través de `agendar_visita()` (`SECURITY DEFINER`), que valida todo en una transacción.
- Los administradores (`es_admin()`) tienen acceso completo.
- Storage: lectura pública del bucket; subir y borrar solo para admins.
