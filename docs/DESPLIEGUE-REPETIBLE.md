# Instancia nueva para un cliente en menos de 1 hora (V4)

Objetivo: levantar PrintHub3D para un taller nuevo con **base propia, cuentas a nombre del cliente** y verificar que quedó bien. Plantilla: `render.yaml` (API + web) en la raíz del repo.

## Estado de la prueba
- **Probado el 08/11/2026 desde cero en esta máquina**: base nueva (Mongo en memoria) → build de backend (`npm run build`) y de frontend (`npm run build`) → arranque → `scripts/smoke-test.mjs` con 8 chequeos (ver abajo).
- **NO probado**: el camino con Atlas + Render + Vercel reales y el de Docker (no hay Docker ni cuentas de nube en esta máquina). Los pasos de abajo salen de `render.yaml`, `DEPLOY.md` y de la documentación de cada plataforma; **la primera vez que se haga con un cliente real hay que cronometrarlo y corregir esta guía**.

## Antes de empezar (cuentas a nombre del cliente)
Dominio, MongoDB Atlas, Render y (si se usa) Vercel, Mercado Pago, Twilio. Se crean con el correo del cliente; el proveedor del software es **colaborador**, no dueño (checklist de traspaso en `docs/MANUAL-TALLER.md`).

## Pasos (≈ 45 min)
1. **Atlas** (10 min): proyecto + cluster (Flex o M10) + usuario de base con contraseña larga + «Network Access»: las IP de salida de Render (o `0.0.0.0/0` si el plan no tiene IP fijas, y dejarlo anotado como riesgo). Copiar la cadena `MONGO_URI`.
2. **Render, API** (10 min): *New → Blueprint* sobre este repo (usa `render.yaml`). Cargar `MONGO_URI`, `CLIENT_URL` (la URL pública del front) y, si ya existen, `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`. `JWT_SECRET` lo genera Render. Plan **Starter** para que no se duerma.
3. **Frontend** (10 min): el mismo Blueprint crea `printhub3d-web`; cargar `NEXT_PUBLIC_API_URL` con la URL de la API **antes del primer build** (si falta, el build corta a propósito). En Vercel: carpeta raíz `frontend`, misma variable; el archivo `frontend/vercel.json` evita desplegar ramas de `dependabot/*`.
4. **Admin** (5 min): desde *Shell* del servicio de la API:
   ```bash
   node dist/scripts/create-admin.js --email dueño@taller.com --password "UnaClaveLargaDeAlMenos12"
   ```
   (mínimo 12 caracteres). Entrar, activar la **verificación en dos pasos** (`POST /api/auth/2fa/setup`) y crear los operarios con PIN en «Operarios».
5. **Dominio y HTTPS** (5 min): apuntar el dominio; completar `frontend/public/.well-known/security.txt` (campo `Contact:`) y `CLIENT_URL` con el dominio final.
6. **Monitoreo** (5 min): `docs/MONITOREO.md`.
7. **Prueba de humo** (2 min), desde cualquier máquina con Node 18+:
   ```bash
   API_URL=https://api.taller.com WEB_URL=https://taller.com SMOKE_EMAIL=dueño@taller.com SMOKE_PASSWORD=... node scripts/smoke-test.mjs
   ```
   Debe terminar en «Todo en orden». Chequea: API viva con base OK, encabezados de seguridad, CORS cerrado, ruta protegida con 401, tienda 200, CSP en bloqueo, `security.txt` completo y login.
8. **Webhook de Mercado Pago**: `https://api.taller.com/api/payments/webhook` + copiar la clave secreta a `MP_WEBHOOK_SECRET` (ver `DEPLOY.md`).

## Lo que corrí para verificar (08/11/2026)
`smoke-test.mjs` contra la instancia local: 7 de 8 chequeos OK; el octavo (`security.txt` con contacto) **falla a propósito** hasta que alguien complete el correo de contacto. Eso es lo que debe pasar: la prueba cuida que no se entregue una instancia con el contacto sin completar.
