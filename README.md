# SweetDay — Sistema Inteligente para Tienda de Aeropuerto

Fases 0, 1, 2 y parte de la 3 del roadmap: backend (FastAPI + PostgreSQL) y frontend (Angular) con autenticación por roles (Dueña / Empleada), CRUD funcional de **Usuarios**, **Categorías**, **Proveedores** y **Productos**, punto de venta (**Ventas**) con apertura/cierre de caja, ticket imprimible y **escaneo de código de barras**, **Historial de Ventas** y **Reportes** con ingresos/egresos/ganancia neta — todo end-to-end.

## 🟢 Corriendo ahora mismo, para revisar

Mientras se desarrollaba esto se dejó un entorno completo levantado en esta máquina:

- **App:** http://localhost:4200
- **API / Swagger:** http://localhost:8000/docs

Cuentas de prueba (ya cargadas, junto con 2 proveedores, 3 categorías y 3 productos):

| Rol | Email | Contraseña |
|---|---|---|
| Dueña | `duena@sweetday.com` | `cambiar123` |
| Empleada | `empleada@sweetday.com` | `empleada123` |

Esto corre sobre un PostgreSQL local dedicado a este proyecto (no el Postgres del sistema), guardado en `backend/.pgdata/` (gitignorado, no se sube) — y ya tiene las ventas reales que se hicieron probando la app anterior. Para pararlo o volver a levantarlo:

```bash
# Detener
pg_ctl -D backend/.pgdata stop
# ...y matar los procesos de uvicorn / ng serve que quedaron corriendo (ver `ps aux | grep -E "uvicorn|ng serve"`)

# Volver a levantar la base
pg_ctl -D backend/.pgdata -o "-p 5433 -k /tmp" -l backend/.pgdata/server.log start
# Backend (en backend/, con el venv activado): uvicorn app.main:app --reload
# Frontend (en frontend/): npm start
```

Si prefieres el flujo normal con Docker (recomendado para cuando esto pase a otra máquina), sigue leyendo.

## Estructura

```
backend/    API FastAPI + SQLAlchemy + Alembic
frontend/   Angular 18 (standalone components)
docker-compose.yml
```

## Levantar todo con Docker

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

- Backend: http://localhost:8000/docs (Swagger)
- Frontend: http://localhost:4200
- PostgreSQL: localhost:5432 (user/pass/db: `sweetday`)

Al primer arranque, la base está vacía. Aplica las migraciones incluidas en el repo y el seed:

```bash
docker compose exec backend alembic upgrade head
docker compose exec backend python -m app.seed
```

(Si más adelante cambias un modelo, generas la migración nueva con `alembic revision --autogenerate -m "descripcion"`.)

Esto crea la cuenta inicial:

- **Email:** `duena@sweetday.com`
- **Contraseña:** `cambiar123` (rol `DUENA`, cambiarla en el primer ingreso)

## Backend sin Docker

Requiere Python 3.12+ y una instancia de PostgreSQL accesible.

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # ajustar DATABASE_URL si no usas Docker
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

## Frontend sin Docker

Requiere Node.js 20+. El escaneo de código de barras (`@zxing/browser`) necesita permiso de cámara — Chrome/Firefox solo lo dan en `localhost` o HTTPS, así que en producción hace falta certificado.

```bash
cd frontend
npm install
npm start
```

## Roles

Solo dos roles fijos (ver `app/models/usuario.py` y `app/api/deps.py::requiere_rol`):

- **Dueña**: acceso completo — productos, categorías, proveedores, usuarios, compras/reabastecimiento, historial, reportes y la apertura/cierre de caja.
- **Empleada**: solo puede entrar al módulo Ventas, y solo puede cobrar si la Dueña ya abrió la caja del día.

El guard de rol vive tanto en el backend (`Depends(requiere_rol(RolUsuario.DUENA))`) como en el frontend (`rolGuard('DUENA')` en `app.routes.ts`) — si se agrega un endpoint o ruta nueva reservada a la Dueña, hay que protegerla en ambos lados.

## Qué ya funciona

- **Usuarios**: listar, crear (Dueña/Empleada), activar/desactivar. Solo la Dueña accede a este módulo.
- **Categorías**: listar, crear, desactivar (baja lógica).
- **Proveedores**: listar, crear, editar, desactivar. Cada fila tiene botones directos de **WhatsApp** (`wa.me`) y **llamar** (`tel:`) si el proveedor tiene teléfono cargado — asume número boliviano (antepone 591 si no trae código de país).
- **Productos**: listar con pestañas Activos/Inactivos y buscador, crear, editar, desactivar y **reabastecer**. Cada producto exige **proveedor** y **costo** además del precio de venta. El botón "Escanear" abre la cámara.
- **Compras (reabastecimiento)**: desde Productos, el icono de camión registra una compra a proveedor — sube el stock del producto y queda contabilizada como **egreso** en Reportes.
- **Ventas**: apertura/cierre de caja (solo Dueña) y punto de venta — buscar, escanear o tocar un producto para agregarlo al carrito, cobrar. Bloquea la venta si no hay caja abierta y valida stock disponible. Al cobrar se genera un **ticket de venta** en pantalla (folio, cajera, productos, total) con botón de impresión — usa el diálogo de impresión del navegador y solo imprime el ticket, no el resto de la app.
- **Historial de Ventas**: lista de ventas pasadas filtrable por fecha, con botón para reabrir y reimprimir el ticket de cualquiera.
- **Reportes**: ingresos (ventas), egresos (compras a proveedores) y ganancia neta, con filtro Hoy / Este mes / Todo.
- **Escaneo de código de barras**: cámara vía `@zxing/browser` (decodifica en el propio navegador, sin costo ni límite de llamadas), con selector automático de cámara trasera, linterna si el dispositivo la soporta, y **entrada manual siempre visible** como respaldo si la cámara falla en algún celular. En Ventas agrega el producto directo al carrito; en Productos, si el código no existe en el catálogo, consulta gratis la **API pública de Open Food Facts** (sin API key) para autocompletar nombre e imagen — funciona bien con snacks/bebidas, y si no encuentra nada (p. ej. maletas o candados) se completa a mano.

## Pendiente (fuera de esta fase)

- **Alertas** (stock bajo, vencimientos) sigue como pantalla placeholder.
- **Dashboard** con métricas en vivo (hoy es placeholder; los números ya existen vía `/api/reportes/resumen` y `/api/ventas`, falta el panel).
- Capa de IA (predicción de demanda y reconocimiento visual sin código de barras) — Fases 5 y 6.

## Validado en este entorno

- Backend: flujo completo de punta a punta contra un PostgreSQL real — login, roles, crear proveedor → producto con costo/proveedor obligatorios, abrir caja, vender con descuento de stock, historial devolviendo las ventas con nombre de cajera y costo unitario por línea, registrar una compra (sube stock, aparece como egreso), `/api/reportes/resumen` calculando ingresos/egresos/ganancia neta correctamente antes y después de la compra, y confirmando que la Empleada recibe 403 en reportes/historial/compras. Migraciones de Alembic generadas y aplicadas (`alembic/versions/`, incluidas en el repo) — la segunda migración rellena `costo_unitario` en ventas anteriores a este cambio usando el costo actual del producto, para no perder las ventas reales que ya existían en la base.
- Bugs reales encontrados y corregidos al probar contra datos reales:
  1. `passlib` (hasheo de contraseñas) no es compatible con las versiones actuales de `bcrypt` y tronaba al crear cualquier usuario. Se reemplazó por el paquete `bcrypt` directo (`app/core/security.py`).
  2. `EmailStr` de Pydantic rechaza dominios `.local` por ser un TLD reservado — el seed usaba `duena@sweetday.local`, se cambió a `.com`.
  3. La plantilla de Reportes usaba `@else if (resumen(); as r)` — Angular solo permite el binding `as` en el `@if` principal, no en un `@else if`. Se anidó un `@if` propio dentro del `@else`.
- Frontend: `npm install`, `ng build` (dev y producción) compilan sin errores. El bundle inicial de producción se mantiene en ≈ 343 kB — la librería de escaneo (~490 kB) queda en un chunk separado que solo se descarga cuando se abre la cámara, no afecta la carga inicial.
