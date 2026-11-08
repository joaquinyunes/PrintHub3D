# Monitoreo (V7)

Hay tres capas: ¿está viva?, ¿qué errores tira?, ¿y no se duerme?.

## 1. ¿Está viva? (uptime)
La API responde `GET /api/health` → `200` con el estado de la base (`services.database.status: "OK"`). Si la base se cae, el endpoint lo informa.
Configurar en **UptimeRobot** (plan gratis: chequeo cada 5 min) o **Better Stack**:
- Monitor HTTP 1: `https://api.TALLER.com/api/health` — palabra clave que debe aparecer: `"OK"`.
- Monitor HTTP 2: `https://TALLER.com/` (la tienda).
- Avisos por mail y, mejor, a un canal de WhatsApp/Telegram del dueño.
Anotar acá los monitores creados (👤 al armar la instancia del cliente; hoy **no hay ninguno creado**, no hay instancia publicada).

## 2. Errores a un panel
Implementado: cada error 500 manda un aviso a un webhook si se define `ALERT_WEBHOOK_URL` (`backend/src/utils/alert.ts`).
- Sirve con Discord (webhook del canal), Slack, o cualquier herramienta que reciba JSON (n8n, Make, Better Stack).
- Manda solo método, ruta y mensaje; **nunca** el cuerpo del pedido ni datos personales.
- Como mucho **un aviso por minuto por error repetido**.
- Probado con 3 tests (`backend/tests/alert.test.ts`): manda el aviso, no inunda, no avisa en 4xx ni sin la variable.
Si el cliente quiere un panel con historial y agrupación, **Sentry** (plan gratis) se agrega con `@sentry/node`; no se incluyó para no sumar una dependencia que nadie pidió todavía.

## 3. Que no se duerma
- Render: usar plan **Starter** (el gratuito se duerme tras 15 min sin tráfico y tarda ~40 s en volver). Ya está así en `render.yaml`.
- Vercel: el plan Hobby es para uso no comercial; un taller que cobra necesita Pro (revisar los términos vigentes de Vercel). Alternativa: el frontend en Render (también está en `render.yaml`).
- Como respaldo, el monitor de uptime cada 5 min mantiene el servicio despierto.

## 4. Qué hago si se cae (runbook corto)
1. ¿Responde `/api/health`? No → mirar *Logs* del servicio de la API en Render.
2. Responde pero `database` ≠ OK → Atlas: ¿cluster pausado, IP no permitida o usuario cambiado? (`MONGO_URI`).
3. La tienda no carga pero la API sí → último deploy del frontend en Vercel/Render; volver al deploy anterior (*Rollback*).
4. Tras arreglar, correr `scripts/smoke-test.mjs` (ver `docs/DESPLIEGUE-REPETIBLE.md`).
