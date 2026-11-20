# Entorno de demostración aparte (V3)

Regla: **el entorno real nunca se usa para mostrar**. La demo es otra base, otro servicio y otro sitio, con datos de ejemplo rotulados «(demo)» y un cartel fijo «ENTORNO DE DEMOSTRACIÓN».

## Qué hay (probado)
- `npm run seed:demo-taller` (en `backend/`): carga el taller `demo_taller` con 3 productos con partes, 4 pedidos (atrasado, hoy, mañana, semana que viene) que generan 9 piezas en la cola, 2 operarios con PIN, 3 insumos (uno bajo mínimo) y dos usuarios (`admin@demo.example`, `personal@demo.example`).
- **Seguro por diseño**: solo corre con `DEMO_MODE=true` **y** contra una base cuyo nombre contenga «demo»; si no, se niega. Se puede correr de nuevo para resetear la demo (borra y recrea solo el taller `demo_taller`).
- Con `DEMO_MODE=true` el backend **no manda avisos reales** (WhatsApp) aunque haya credenciales.
- Con `NEXT_PUBLIC_DEMO=1` al compilar el frontend aparece el cartel de demostración en todas las páginas.
- Tests: `backend/tests/demo.test.ts` (rechazo de bases sin «demo», datos rotulados, idempotencia).

## Cómo armarla (👤, ≈ 20 min; no hay instancia publicada todavía)
1. **Atlas**: una base nueva `printhub_demo` (puede ser el mismo cluster; el nombre debe contener «demo»).
2. **Render**: un servicio de API aparte (`printhub3d-demo-api`) con `DEMO_MODE=true`, `MONGO_URI=…/printhub_demo`, `DEFAULT_TENANT_ID=demo_taller`, `CLIENT_URL=<url de la demo>`. **Sin** `MP_ACCESS_TOKEN` real ni credenciales de Twilio.
3. **Frontend**: un sitio aparte compilado con `NEXT_PUBLIC_DEMO=1` y `NEXT_PUBLIC_API_URL=<api de la demo>`.
4. Desde un shell del servicio de demo: `DEMO_ADMIN_PASSWORD="<12+ caracteres>" npm run seed:demo-taller`.
5. Probar con `scripts/smoke-test.mjs` apuntando a la demo.

## Lo que NO es la demo
- No es un cliente real ni una prueba de uso: sirve para mostrar el flujo (producto con partes → pedido → cola → PIN → seguimiento).
- Los datos vuelven a su estado inicial cada vez que se corre el seed; conviene correrlo antes de cada presentación.
