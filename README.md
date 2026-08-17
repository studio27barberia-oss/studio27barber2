# Barber OS

Sistema de administración para barbería. React + Vite + Supabase (Postgres,
Auth, RLS, Realtime). PWA instalable en iPad / iPhone / Android.

## 1. Estructura del proyecto

```
src/
  components/    pantallas y piezas de UI (Dashboard, NuevaVenta, Historial, ui.jsx, etc.)
  hooks/         useAuth (sesión + rol), useSales (datos + realtime)
  services/      capa de acceso a Supabase (una función = una operación)
  lib/           cliente de Supabase (lib/supabase.js) y tokens de diseño (lib/theme.js)
  utils/         formato de moneda, fechas, constantes (métodos de pago, etc.)
  App.jsx        shell principal: login, navegación, enrutamiento por rol
  main.jsx       punto de entrada de React
supabase/
  schema.sql     TODO el SQL: tablas, índices, RLS, función create_sale()
public/
  manifest.json  manifest de la PWA
.env.example     variables de entorno que necesitas llenar
```

## 2. Requisitos

- Node.js 18 o superior
- Una cuenta de Supabase (gratis) — https://supabase.com

## 3. Configurar Supabase (tú tienes que hacer esto — yo no tengo acceso a tu cuenta)

1. Crea un proyecto nuevo en https://supabase.com/dashboard.
2. Ve a **SQL Editor** → pega el contenido completo de `supabase/schema.sql` → **Run**.
   Esto crea todas las tablas, la función `create_sale()` y todas las políticas
   de seguridad (RLS). Es seguro, no borra nada si el proyecto es nuevo.
3. Ve a **Project Settings → API** y copia:
   - `Project URL` → esto es `VITE_SUPABASE_URL`
   - `anon public key` → esto es `VITE_SUPABASE_ANON_KEY`
4. Crea tu primer usuario administrador:
   - **Authentication → Users → Add user** (marca "Auto Confirm User").
   - Copia su UUID.
   - En **SQL Editor** corre (reemplazando los valores):
     ```sql
     insert into profiles (id, full_name, role)
     values ('EL-UUID-QUE-COPIASTE', 'Tu nombre', 'admin');
     ```
5. (Opcional) Da de alta a tus barberos reales en la tabla `barbers` desde el
   editor de tablas de Supabase, o desde la app una vez que entres como admin.
6. Para usuarios de recepción o barbero: repite el paso 4 con
   `role = 'recepcion'` o `role = 'barbero'`. Si es barbero, además llena
   `barber_id` con el `id` de su fila en `barbers` — así Row Level Security
   filtra automáticamente para que solo vea sus propios datos.

## 4. Correr el proyecto localmente

```bash
npm install
cp .env.example .env
# edita .env y pega tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

Abre la URL que te muestre la terminal (normalmente http://localhost:5173).

> Nota: no pude ejecutar `npm install` ni `npm run dev` en este entorno
> porque no tengo acceso a internet aquí. El código está escrito y
> revisado por sintaxis, pero la primera compilación real la vas a ver
> tú al correr estos comandos — si algo truena, pégame el error exacto
> y lo corrijo.

## 4.1 Activar Supabase Realtime (importante)

El código ya está escrito para escuchar cambios en vivo (`useSales`,
`useRealtimeTable`, `CitasHoy`), pero Postgres solo transmite esos cambios
si la tabla está agregada a la publicación `supabase_realtime`. Esto ya
viene incluido al final de `supabase/schema.sql` (sección 13).

- Si es la **primera vez** que corres el proyecto: ya está cubierto, no
  hagas nada extra.
- Si **ya habías corrido `schema.sql` antes** (de una versión anterior sin
  esto): ve a **SQL Editor** en Supabase y corre `supabase/enable_realtime.sql`
  — son solo las líneas que faltan, seguro de correr encima de datos
  existentes.

Qué queda en vivo entre dispositivos gracias a esto:
- **Ventas** (`sales`, `sale_items`, `sale_products`): el dashboard, ventas
  del día, semana e historial del administrador se actualizan solos en
  cuanto recepción cobra, sin recargar la página.
- **Citas** (`appointments`): si dos personas tienen abierta la pantalla de
  "Citas de hoy", ambas ven las citas nuevas al instante.
- **Barberos, Servicios, Productos, Clientes**: si el admin cambia una
  comisión o un precio desde el celular, y recepción tiene esa pantalla
  abierta en el iPad, se refresca sola. Esto también cubre el caso de
  que el **inventario baje en vivo** en la pantalla de Productos cuando
  se vende algo desde otro dispositivo.

## 5. Exportar reportes a Excel / PDF (opcional)

CSV funciona sin nada adicional. Para Excel y PDF instala:

```bash
npm install xlsx jspdf jspdf-autotable
```

Si no las instalas, los botones de "Excel" y "PDF" en Reportes te avisan
con una alerta en vez de fallar en silencio.

## 6. Publicar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En https://vercel.com → "Add New Project" → importa el repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
4. En **Environment Variables** agrega `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` con los mismos valores de tu `.env`.
5. Deploy.

## 7. Instalar en iPad / iPhone (PWA — "Agregar a inicio")

1. Abre la URL de tu app publicada en Safari (no Chrome, en iOS tiene que
   ser Safari para que funcione "Agregar a pantalla de inicio").
2. Toca el botón de compartir (el cuadro con la flecha hacia arriba).
3. Elige **"Agregar a pantalla de inicio"**.
4. Se instala un ícono llamado "Barber OS" que abre a pantalla completa,
   sin barra de navegador — se siente como una app nativa.

## 8. Instalar en Android

1. Abre la URL en Chrome.
2. Chrome debería mostrar automáticamente un banner "Agregar Barber OS a
   la pantalla de inicio" (o menú ⋮ → "Instalar app" / "Agregar a inicio").

## 9. Roles y seguridad

- **admin**: acceso total (dashboard, historial, barberos, servicios,
  productos, clientes, reportes).
- **recepcion**: inicio (nueva venta + citas de hoy), nueva venta, ventas
  del día, clientes. No ve comisiones ni puede editar precios/comisiones.
- **barbero**: solo ve sus propias ventas del día (filtrado automáticamente
  por RLS en la base de datos — no es solo una pantalla oculta en el
  frontend, el propio Postgres rechaza cualquier intento de leer datos de
  otro barbero, incluso si alguien manipulara el código del navegador).

El PIN que existía en el prototipo anterior YA NO se usa — fue reemplazado
por Supabase Auth (correo + contraseña) en toda la app.

## 10. Historial permanente

Las ventas nunca se borran ni se reinician. "Hoy", "Semana" y "Mes" son
solo filtros de fecha sobre la misma tabla `sales`. La pantalla
**Historial** (solo admin) permite consultar cualquier rango de fechas,
filtrando además por barbero, método de pago y servicio.

## 11. Lo que pude verificar aquí, y lo que no

Verificado en este entorno (sin internet):
- Balance de sintaxis (llaves/paréntesis) de los 28 archivos .js/.jsx.
- Que cada `import { X } from "./ui"` corresponde a algo que `ui.jsx`
  realmente exporta.
- Revisión manual del SQL (tipos, referencias FK, políticas RLS).

NO pude verificar (requiere que tú lo hagas y me digas si algo falla):
- `npm install` / `npm run build` reales (sin acceso a internet aquí).
- Conexión real a un proyecto de Supabase.
- Que una venta se registre de punta a punta contra una base de datos real.
- Despliegue en Vercel.
