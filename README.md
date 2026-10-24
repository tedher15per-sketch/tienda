# Mostrador Abarrotes

App web para tienda de abarrotes: caja con escáner (cámara en vivo, foto o lectora USB/Bluetooth), inventario con caducidades y mínimos, pedidos de clientes en línea, órdenes de compra a proveedores, cuaderno de fiado y roles de personal. Se instala en el celular como app (PWA).

**Stack:** HTML + JavaScript sin build · [Supabase](https://supabase.com) (Postgres, Auth, Storage, Realtime) · hosting estático en Vercel o Render. Todo cabe en los planes gratuitos.

## Roles

| Puesto | Qué ve |
|---|---|
| **Dueño** (admin) | Resumen, Vender, Inventario, Pedidos, Compras, Fiado, Personal. Puede “ver como” otro rol. |
| **Cajero** | Vender, Pedidos, Fiado, Inventario (consulta) |
| **Almacén** | Inventario (altas, fotos, entradas/salidas), Compras |
| **Cliente** | Tienda en línea y Mis pedidos (sin cuenta puede ver el catálogo) |

La **primera cuenta** que se registra queda como dueño. El resto entra como cliente y pide puesto desde la app; el dueño lo aprueba en *Personal*. Los permisos se validan en la base de datos (Row Level Security), no solo en la pantalla.

## Puesta en marcha (≈10 minutos)

### 1. Supabase
1. Crea un proyecto en supabase.com (región: la más cercana, p. ej. `us-east-1`).
2. **SQL Editor → New query**: pega `supabase/schema.sql` y dale **Run**.
3. (Opcional) Corre también `supabase/ejemplos.sql` para tener 17 productos de prueba.
4. **Project Settings → API**: copia *Project URL* y *anon public key* en `config.js`.
5. **Authentication → URL Configuration**: en *Site URL* pon la dirección final de tu sitio (la de Vercel o Render) para que los correos de confirmación y de “olvidé mi contraseña” regresen ahí.
   - Para pruebas rápidas puedes apagar *Confirm email* en **Authentication → Providers → Email**.

### 2a. Vercel
```bash
npm i -g vercel
vercel          # primera vez: acepta los valores por defecto (no hay build)
vercel --prod
```
O sube la carpeta a un repo de GitHub e impórtalo en vercel.com → *Add New Project* (Framework: **Other**, sin build command, output: raíz).

### 2b. Render
Sube la carpeta a GitHub y en render.com elige **New → Blueprint** (usa `render.yaml`) o **New → Static Site** con *Publish directory* `.` y sin build command.

### 3. Primer uso
1. Abre tu sitio y toca **Entrar → Crear cuenta**. Esa cuenta es el dueño.
2. En *Personal* ponle nombre a la tienda.
3. Inventario → **Nuevo producto** → escanea el código con la cámara.

## Respaldo automático (gratis)
El workflow `.github/workflows/respaldo.yml` corre cada noche a las 03:17 (hora del centro de México):
saca una copia completa de la base (`.sql` y `.json`, comprimidos) y la guarda 30 días en GitHub.
Como usa la base todos los días, también evita que Supabase gratis la pause por inactividad.

Configuración (una sola vez):
1. **Haz privado el repo** (Settings → General → Danger Zone → Change visibility). Los respaldos traen teléfonos y direcciones de clientes.
2. En Supabase → botón **Connect** → pestaña *Connection string* → elige **Session pooler** y copia la URI.
   Cambia `[YOUR-PASSWORD]` por la contraseña de la base (si no la sabes: Project Settings → Database → *Reset database password*).
3. En GitHub → Settings → **Secrets and variables → Actions → New repository secret**:
   nombre `SUPABASE_DB_URL`, valor = la URI completa.
4. Pestaña **Actions → Respaldo nocturno → Run workflow** para probarlo. Al terminar, el respaldo aparece abajo en *Artifacts*.

**Restaurar:** descarga el artifact, descomprime `base-AAAA-MM-DD.sql.gz` y córrelo con
`psql "$SUPABASE_DB_URL" -f base-AAAA-MM-DD.sql` sobre un proyecto vacío (o pídele ayuda a quien te mantenga la app).

En la app, el dueño también tiene en *Personal* los botones **Descargar respaldo completo**, **Inventario en Excel** y **Ventas en Excel**.

## Inventario por WhatsApp
Tú o tu personal le escriben al WhatsApp de la tienda y el inventario se actualiza solo:

| Mensaje | Qué hace |
|---|---|
| `llegaron 24 coca 600 y 12 leche` | Entrada de mercancía |
| `merma 2 pan` · `caducaron 3 yogur` | Salida / merma |
| `quedan 5 tortillas` | Conteo exacto |
| `cuánto hay de huevo` | Consulta existencia y precio |
| `qué falta` · `qué caduca` · `ventas de hoy` | Reportes rápidos |
| `ayuda` | Lista de comandos |

Entiende números con letra ("una docena", "medio kilo"), gramos → kilos, códigos de barras y **apodos** (Inventario → Editar → *Apodos para WhatsApp*, p. ej. `coca, refresco`). Si hay duda entre dos productos, pregunta y respondes con el número. Cada movimiento queda en el historial del producto con el nombre de quien lo mandó. Solo responden los números que el dueño autoriza en **Personal → WhatsApp de inventario**.

Código: `supabase/functions/whatsapp/` (ya desplegado en Supabase como función `whatsapp`).

### Conectar con Meta (una sola vez, ~20 min)
1. Entra a [developers.facebook.com](https://developers.facebook.com) → **Mis apps → Crear app** → caso de uso *Conectar con clientes por WhatsApp* (tipo Empresa).
2. En **WhatsApp → Configuración de la API** Meta te da un **número de prueba**. En *Para* agrega tu celular y confírmalo con el código que te llega.
3. Inventa una palabra secreta para verificar (ej. `tiendita-2026-xyz`). En Supabase → **Edge Functions → Secrets** agrega:
   - `WA_VERIFY_TOKEN` = tu palabra secreta
   - `WA_APP_SECRET` = Meta → *Configuración de la app → Básica → Clave secreta de la app*
   - `WA_TOKEN` = el token de acceso de *Configuración de la API* (el temporal dura 24 h; el permanente se saca en *Configuración del negocio → Usuarios del sistema → Generar token* con permisos `whatsapp_business_messaging` y `whatsapp_business_management`)
4. En Meta → **WhatsApp → Configuración → Webhook → Editar**:
   - URL de devolución: `https://vrzchnnwjczaugobweml.supabase.co/functions/v1/whatsapp`
   - Token de verificación: tu palabra secreta → **Verificar y guardar**
   - En *Campos del webhook* suscríbete a **messages**.
5. En la app → Personal → WhatsApp de inventario, autoriza tu celular (10 dígitos).
6. Manda `hola` al número de prueba. Debe contestarte con la lista de comandos.

Para usar el número real de la tienda: en *Configuración de la API → Agregar número de teléfono* registra el chip (no debe estar en la app normal de WhatsApp) y Meta te pedirá verificar el negocio.

**Costo:** los mensajes que recibe la tienda son gratis y las respuestas también, hasta 1,000 al mes por número.

## Escáner
- **Cámara en vivo**: funciona en cualquier sitio HTTPS (Vercel/Render ya lo son). En *Vender*, el botón **Cámara** queda abierto y va agregando cada producto al ticket.
- **Foto**: alternativa si el navegador no da cámara en vivo.
- **Lectora USB/Bluetooth**: deja el cursor en la barra de búsqueda de *Vender*; la lectora escribe el código y Enter.
- Lee EAN-13, UPC, Code 128 y QR.

## Estructura
```
index.html            estilos y estructura
app.js                vistas y lógica (caja, inventario, pedidos, compras, fiado, personal)
db.js                 capa de datos sobre Supabase (documentos + tiempo real)
config.js             URL y anon key de Supabase
supabase/schema.sql   tabla, roles, políticas RLS, bucket de fotos, trigger del dueño
supabase/ejemplos.sql productos de prueba
.github/workflows/respaldo.yml  respaldo nocturno
supabase/functions/whatsapp/   bot de inventario por WhatsApp
```

## Notas
- Los datos viven en una tabla `docs (collection, id, data jsonb)`. Es simple de mantener; si después quieres reportes pesados en SQL, se puede migrar a tablas normalizadas por colección.
- Las existencias se suman y restan en el servidor de forma atómica (`stock_add`), así que varias cajas pueden vender a la vez. Una venta con varios productos no es una sola transacción: si se cae el internet a la mitad, el *Conteo físico* en Inventario corrige la diferencia.
