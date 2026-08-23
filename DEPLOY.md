# Despliegue — PrintHub3D

## Requisitos
- Docker + Docker Compose v2
- Un dominio (o subdominio) para el frontend y otro para la API, con HTTPS
  (usá un reverse proxy: Caddy, Traefik o Nginx delante de los contenedores).

## 1. Configurar variables

```bash
cp .env.prod.example .env.prod
# Editar .env.prod:
#   JWT_SECRET          -> cadena larga y aleatoria (openssl rand -hex 32)
#   CLIENT_URL          -> https://tienda.tudominio.com
#   API_PUBLIC_URL      -> https://api.tudominio.com
#   NEXT_PUBLIC_API_URL -> https://api.tudominio.com   (igual que API_PUBLIC_URL)
```

Opcionales pero recomendados: `MP_ACCESS_TOKEN` + `MP_WEBHOOK_SECRET` (MercadoPago),
`TWILIO_*` + `ADMIN_WHATSAPP` (notificaciones WhatsApp), `SMTP_*` (emails).

## 2. Levantar

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Servicios:
| Servicio       | Puerto host                    | Notas |
|----------------|--------------------------------|-------|
| `frontend`     | `FRONTEND_PORT` (3000)         | Next.js standalone |
| `backend`      | `BACKEND_PORT` (5000)          | API Express |
| `mongodb`      | interno (sin exponer)          | datos en volumen `mongo-data` |
| `mongo-backup` | —                              | `mongodump` diario a `./backups`, retención 14 días |

Poné el reverse proxy con HTTPS apuntando `tienda.tudominio.com -> frontend:3000`
y `api.tudominio.com -> backend:5000`.

## 3. Crear el usuario administrador

```bash
docker compose -f docker-compose.prod.yml exec backend \
  node dist/scripts/create-admin.js --email jefe@tudominio.com --password "TuClaveFuerte"
```
Si omitís `--password`, genera una aleatoria y la muestra una sola vez.

## 4. Webhook de MercadoPago
En el panel de MercadoPago configurá la URL de notificaciones:
`https://api.tudominio.com/api/payments/webhook` y copiá la clave secreta a
`MP_WEBHOOK_SECRET`. `auto_return` de MP no funciona con `localhost`: probá siempre
con el dominio público.

## Operación

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restaurar un backup
docker compose -f docker-compose.prod.yml exec -T mongodb \
  mongorestore --uri="mongodb://localhost:27017/global3d" --drop --gzip --archive < backups/global3d-XXXX.archive.gz

# Actualizar a una versión nueva
git pull && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Desarrollo local
`docker-compose.yml` (sin `.prod`) levanta Mongo + backend + frontend en modo dev
con hot-reload. Para correr sin Docker: `npm install` en `backend/` y `frontend/`,
luego `npm run dev` en la raíz.
