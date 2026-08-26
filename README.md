# PrintHub3D

Sistema de gestión para talleres de impresión 3D: tienda pública + pedidos
personalizados + producción + caja + cotizador, en un solo lugar.

- **Backend:** Node + Express 5 + MongoDB (Mongoose) · `backend/`
- **Frontend:** Next.js 16 + React 19 + Tailwind · `frontend/`

## Desarrollo local

Requisitos: Node 20+, MongoDB (local o `docker compose up mongodb`).

```bash
make install        # o: cd backend && npm ci ; cd ../frontend && npm ci
cp backend/.env.example backend/.env    # completá MONGO_URI y JWT_SECRET
make seed                                # settings iniciales
ADMIN_EMAIL=vos@tu-dominio.com make admin
make dev                                 # backend :5000 + frontend :3000
```

Variables mínimas del backend (`backend/.env`): `MONGO_URI`, `JWT_SECRET`,
`CLIENT_URL`. Todo lo demás (MercadoPago, Twilio/WhatsApp, SMTP) es opcional y
está documentado en `backend/.env.example`.

## Producción

Ver **[DEPLOY.md](DEPLOY.md)** — `docker-compose.prod.yml` con imágenes
construidas, healthchecks, Mongo sin puerto expuesto y backup diario.

```bash
cp .env.prod.example .env.prod   # completar
make up
```

## Qué incluye

| Módulo | Ruta admin | Estado |
|---|---|---|
| Dashboard | `/admin` | ✅ |
| Pedidos + producción | `/admin/orders`, `/admin/production` | ✅ |
| Inventario + filamentos | `/admin/products`, `/admin/filamento` | ✅ |
| Ventas de mostrador | `/admin/ventas` | ✅ |
| Gastos + reportes | `/admin/expenses`, `/admin/analytics` | ✅ (admin) |
| Cotizador | `/cotizar` (público) + `/api/quotes` | ✅ |
| Config de la web + tienda | `/admin/home`, `/admin/settings` | ✅ (admin) |
| Usuarios y roles | `/admin/usuarios` | ✅ (admin) |
| Pagos MercadoPago | checkout + webhook | 🟡 requiere credenciales |
| Notificaciones WhatsApp | Twilio | 🟡 requiere credenciales |
| Facturación AFIP | — | ⛔ pendiente |
| Integración con impresoras (OctoPrint/Bambu) | — | ⛔ pendiente |

## Roles

- **admin (dueño):** todo, incluida la caja, reportes, configuración y usuarios.
- **staff (operario):** pedidos, producción, inventario, filamentos y clientes.
  No ve finanzas ni configuración.

Crear operarios desde `/admin/usuarios`.

## Scripts útiles (backend)

```bash
npm run typecheck        # tsc --noEmit
npm test                 # jest
npm run seed:settings
npm run create:admin -- --email jefe@taller.com --password "ClaveFuerte"
```
