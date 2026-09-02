# Capacita — Plataforma de Gestión de Capacitaciones

Plataforma integral de gestión de capacitaciones y formación para organizaciones,
municipios e instituciones, inspirada en Moodle pero con una interfaz moderna,
simple e intuitiva. Incluye 4 roles (Administrador, Institución, Profesor/Capacitador,
Alumno), gestión completa de programas/cursos/módulos/clases, banco de
preguntas, evaluaciones, asistencia, progreso automático, certificados con
verificación pública por QR, mensajería, notificaciones, reportes exportables
y un catálogo público de cursos.

## Estado del proyecto

- **Fases 1 a 3 (autenticación, usuarios, cursos, módulos, inscripciones,
  materiales, actividades, foros, progreso, banco de preguntas, evaluaciones,
  calificación y asistencia): 100% funcionales.**
- **Rol Institución (multi-tenant): 100% funcional.** El Administrador general
  crea instituciones desde `/admin/instituciones` (con su propia cuenta de
  acceso); cada Institución ingresa a `/institucion` y administra de forma
  aislada sus propios cursos, programas, profesores y alumnos — sin ver ni
  tocar los de otras instituciones ni los del Administrador. El banco de
  preguntas y las categorías siguen siendo compartidos por toda la
  plataforma (no están aislados por institución) — es una simplificación
  deliberada del v1, ver "Próximos pasos posibles" más abajo.
- **Subida de imágenes desde el equipo: 100% funcional.** En todos los
  lugares donde se elige una imagen (portada de curso, portada de programa,
  logo de institución, foto de perfil, fondo del home) se puede subir un
  archivo real desde la computadora además de pegar una URL — reutiliza el
  mismo mecanismo de almacenamiento que los materiales de curso, que ya
  soporta tanto disco local (desarrollo) como Vercel Blob (producción sobre
  Vercel), ver "Despliegue a producción".
- **Certificados: 100% funcional** (elegibilidad automática, generación de
  PDF con QR, verificación pública por código).
- **Reportes y notificaciones in-app: 100% funcionales.** Los canales de
  email/WhatsApp están *armados a nivel de arquitectura* (columna `channel`,
  funciones `sendEmail`/`sendWhatsapp` en `src/lib/notifications.ts`) pero
  **no envían nada real todavía** — quedan como stubs claramente marcados
  para integrar un proveedor (SendGrid, Resend, Twilio, etc.) en el futuro.
- **Programas (trayectos formativos): funcionales** para agrupar cursos.
- **Gamificación (puntos, insignias, niveles): el modelo de datos está listo**
  (`points_ledger`, `badges`, `user_badges`, `levels` en `src/db/schema.ts`)
  pero la pantalla de administración (`/admin/gamificacion`) es una vista de
  **mock/"próximamente"** — no hay lógica que otorgue puntos todavía.

### Próximos pasos posibles para el rol Institución

El v1 de Institución cubre el pedido central (crear cursos, crear
profesores, asignarlos a cursos, cargar/inscribir alumnos, crear programas,
todo aislado por institución). Quedan afuera, a propósito, por simplicidad:
banco de preguntas y categorías siloados por institución (hoy son
compartidos por toda la plataforma), que un profesor o alumno pertenezca a
más de una institución a la vez, y que una institución tenga más de una
cuenta de acceso propia (hoy el modelo lo permite técnicamente — alcanza con
crear otro usuario con ese mismo `institutionId` — pero no hay una pantalla
para hacerlo desde `/institucion`). Si en algún momento los necesitás,
avisame y los agregamos.

## Stack técnico

- **Next.js 16** (App Router, Turbopack, React 19) + TypeScript
- **PostgreSQL** con **Drizzle ORM** (`postgres-js`) — sin binarios nativos
  externos, portable a cualquier proveedor de Postgres
- **NextAuth v5** (Credentials + JWT) para autenticación y control de roles
- **Tailwind CSS v4** + componentes propios estilo shadcn sobre Radix UI
- **pdf-lib** + **qrcode** para certificados
- **recharts** para los gráficos de los dashboards
- Almacenamiento de archivos subidos con dos drivers (`src/lib/storage.ts`):
  disco local (`storage/uploads/`) en desarrollo, y **Vercel Blob**
  automáticamente en producción sobre Vercel (en cuanto existe
  `BLOB_READ_WRITE_TOKEN`) — necesario porque Vercel no tiene disco
  persistente. Las imágenes se guardan públicas (se sirven directo por el
  CDN); los materiales/entregas se guardan privados y siguen pasando por la
  ruta autenticada `/api/files/[...path]`.

## Cuentas de demostración

Después de correr el seed (ver abajo), quedan disponibles estas 3 cuentas
(contraseña `Demo1234!` para todas):

| Rol         | Email                        |
|-------------|------------------------------|
| Admin       | `admin@capacita.demo`        |
| Institución | `institucion@capacita.demo`  |
| Profesor    | `profesor@capacita.demo`     |
| Alumno      | `alumno@capacita.demo`       |

La cuenta `institucion@capacita.demo` ("Municipalidad de Ejemplo") ya tiene
delegado un curso propio, con su profesor y sus alumnos, para que puedas
explorar el rol Institución sin pasos previos.

El resto de los 10 profesores y 50 alumnos generados por el seed también usan
la contraseña `Demo1234!`, por si querés probar con otras cuentas.

La cuenta de alumno demo está preparada para probar varios flujos en vivo sin
pasos previos:
- Un curso **finalizado al 100%** sin certificado emitido todavía, para
  probar el botón "Solicitar certificado" y ver el PDF real.
- Un curso **desaprobado** (no llegó a aprobar el examen final).
- Un curso **activo**, con una entrega y una evaluación pendientes de
  corrección (para probar el flujo de corrección como `profesor@capacita.demo`,
  que dicta ese mismo curso).
- Un curso **a punto de comenzar**, ya inscripto, con 0% de avance.
- Dos cursos en los que el alumno demo **no está inscripto**, para probar la
  autoinscripción desde el catálogo.

## Desarrollo local

### Requisitos

- Node.js 20+
- PostgreSQL 14+ corriendo localmente (o accesible por red)

### Pasos

```bash
npm install

cp .env.example .env
# completá DATABASE_URL, AUTH_SECRET (una cadena larga y aleatoria) y
# NEXTAUTH_URL=http://localhost:3000

# crea las tablas en la base de datos a partir de src/db/schema.ts
npx drizzle-kit push

# carga datos de demostración (3 programas, 6 cursos, 10 profesores,
# 50 alumnos, materiales, actividades, foros, evaluaciones, certificados...)
npm run seed

npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000) e ingresá con cualquiera
de las cuentas demo de arriba.

### Scripts disponibles

| Comando           | Qué hace                                                        |
|--------------------|-------------------------------------------------------------------|
| `npm run dev`      | Servidor de desarrollo (Turbopack)                                |
| `npm run build`    | Build de producción                                                |
| `npm run start`    | Sirve el build de producción                                       |
| `npm run lint`     | ESLint                                                              |
| `npm run seed`     | Borra y vuelve a cargar la base de datos con datos de demostración |
| `npm run create-admin` | Crea una única cuenta de Administrador real, sin tocar el resto de la base (ver "Despliegue a producción") |

## Despliegue a producción

### Opción A — Vercel + Neon + Vercel Blob (recomendada)

1. **Base de datos**: en el panel de Vercel, pestaña **Storage → Create
   Database → Neon (Postgres)**. Esto crea la base y completa `DATABASE_URL`
   solo en las variables de entorno del proyecto.
2. **Almacenamiento de archivos**: **Storage → Create → Blob**. Esto
   completa `BLOB_READ_WRITE_TOKEN` solo — a partir de acá, todas las
   imágenes y materiales subidos van a Vercel Blob en vez de disco local
   (ver `src/lib/storage.ts`).
3. Subí este proyecto a un repositorio de GitHub e importalo en
   [Vercel](https://vercel.com/new).
4. En **Environment Variables**, además de lo que Neon/Blob completaron
   solos, cargá:
   - `AUTH_SECRET` (generá uno con `openssl rand -base64 32`)
   - `NEXTAUTH_URL` → la URL pública que te asigne Vercel (o tu dominio)
   - `APP_INSTITUTION_NAME` → el nombre que aparece en los certificados
5. Desplegá. Después del primer deploy, corré una sola vez desde tu
   computadora, apuntando a la base de producción (la `DATABASE_URL` que
   generó Neon):
   ```bash
   DATABASE_URL="<tu-url-de-produccion>" npx drizzle-kit push
   ```
6. Creá tu cuenta real de Administrador (no reemplaza nada, solo agrega un
   usuario):
   ```bash
   DATABASE_URL="<tu-url-de-produccion>" npm run create-admin -- --email=admin@tuinstitucion.gob.ar --password=UnaClaveSegura123 --nombre=Nombre --apellido=Apellido
   ```
   `npm run seed` también existe y funciona igual contra producción, pero
   **borra todo lo que haya y lo reemplaza por datos de demostración** — es
   para explorar la plataforma, no para el primer arranque real.

### Opción B — Railway / VPS propio (con disco persistente)

Si preferís que la subida de archivos a disco funcione tal cual está, sin
usar Blob, desplegá en una plataforma con filesystem persistente:

1. Creá un servicio Postgres (Railway lo ofrece con un clic).
2. Creá un servicio a partir de este repo (Railway detecta Next.js
   automáticamente; en un VPS propio: `npm ci && npm run build && npm start`,
   idealmente detrás de PM2 o un servicio systemd).
3. Configurá las mismas variables de entorno que en la Opción A, **sin**
   `BLOB_READ_WRITE_TOKEN` (así el driver de almacenamiento sigue siendo
   disco local).
4. Corré `npx drizzle-kit push` y `npm run create-admin` (o `npm run seed`
   para datos de demo) apuntando a la base de producción.
5. Asegurate de que el directorio `storage/uploads/` persista entre deploys
   (volumen persistente).

### Variables de entorno

Ver `.env.example`. Obligatorias: `DATABASE_URL`, `AUTH_SECRET`,
`NEXTAUTH_URL`. Opcionales: `APP_INSTITUTION_NAME` (tiene un valor por
defecto) y `BLOB_READ_WRITE_TOKEN` (solo en producción sobre Vercel).

- `DATABASE_URL` — cadena de conexión Postgres.
- `AUTH_SECRET` — secreto para firmar las sesiones (JWT) de NextAuth. Generá
  uno propio para producción, nunca reutilices el de `.env.example`.
- `NEXTAUTH_URL` — URL pública completa del sitio en producción.
- `APP_INSTITUTION_NAME` — nombre de la institución que aparece en los
  certificados y comunicaciones.
- `BLOB_READ_WRITE_TOKEN` — activa el driver de Vercel Blob para archivos
  subidos (ver "Opción A" arriba). Sin esta variable, se usa disco local.

### Límite de tamaño de archivos subidos

Next.js limita las Server Actions a 1MB de cuerpo por defecto; en
`next.config.ts` lo subimos a 10MB, suficiente para imágenes (tope propio de
5MB, ver `src/actions/uploads.actions.ts`) y documentos de curso normales.
El hosting elegido puede imponer, además, su propio límite de tamaño de
request por delante de este — para archivos grandes (videos, etc.) conviene
usar un enlace externo (YouTube/Vimeo) en el material en vez de subir el
archivo.

## Estructura del proyecto

```
src/
  actions/          Server Actions (mutaciones) — cada una valida rol/permiso
  app/               Rutas (App Router): públicas, /admin, /profesor, /alumno
  components/        UI compartida, layout, gráficos, componentes por dominio
  data/              Queries de solo lectura (server-only)
  db/                schema.ts (Drizzle), cliente de conexión, seed.ts
  lib/               Auth helpers, storage, notificaciones, progreso,
                     certificados, auditoría, utilidades
```

## Seguridad

- Todas las Server Actions verifican rol/autorización del lado del servidor
  (no dependen de que la UI oculte botones).
- Rutas protegidas por rol mediante `src/proxy.ts` (middleware) y checks en
  cada `layout.tsx` de sección.
- Contraseñas con `bcryptjs`. Recuperación de contraseña con tokens de un
  solo uso y expiración.
- Archivos subidos servidos por una ruta autenticada (`/api/files/[...path]`),
  no expuestos directamente en `/public`.
- Registro de auditoría de acciones administrativas (`activity_logs`).
