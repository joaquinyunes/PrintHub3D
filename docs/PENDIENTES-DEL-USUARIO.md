# Te toca a vos — PrintHub3D (08/11/2026)

Lo que **no** pude hacer (o no corresponde que haga yo), en orden de urgencia.

## Antes del viernes 13/11 (para poder mostrarlo)
1. **Decidir cómo se publica este trabajo.** Quedó en la rama `feat/venta-10k` (avance directo desde `main`) y **no** en `main` para que no se despliegue sola en Render/Vercel sin que la veas. Para publicarlo: abrir un PR `feat/venta-10k → main` y mirar que los 5 trabajos de CI queden verdes (backend, frontend, audit, secretos, secretos-historial).
2. **Completar el contacto de seguridad**: `frontend/public/.well-known/security.txt` → `Contact:` con un correo de seguridad del taller (dejé un marcador a propósito; `scripts/smoke-test.mjs` falla mientras esté sin completar).
3. **Enlace público roto (H12)**: `print-hub3-d.vercel.app` da 503. Dejar **un** proyecto de Vercel de los tres (`print-hub3d`, `printhub3d`, `print-hub3-d`) y borrar los otros; el archivo `frontend/vercel.json` ya ignora ramas `dependabot/*`. Redeploy del front en Render (hoy sin encabezados de seguridad) y del backend con Atlas.
4. **Cambiar el build de Render del backend** a `npm ci && npm run build` (el `|| true` está en el panel de Render, no en el repo; no tengo acceso a tu cuenta de Render: me pidió elegir un espacio de trabajo y no toqué nada). El archivo `render.yaml` ya lo trae bien para un Blueprint nuevo.
5. **Probar la planilla real** en «Importar planilla»: reemplacé la librería `xlsx` (con vulnerabilidades sin parche) por `read-excel-file`; compila pero no la probé con tu `.xlsx` de verdad.

## Decisiones tuyas (no son técnicas)
6. **Precios**: los tres paquetes y la página de venta tienen «Precio: a confirmar». Mirá `docs/VENTA-PAQUETES-Y-COSTO.md`: con las suposiciones escritas, **Printago sale más barato a 3 años en todos los tamaños** (USD 576 a 7.056 contra ≈ USD 14.464 del paquete Completo). USD 10.000 no se sostiene por costo; se sostiene por lo que Printago no hace (cotización, Mercado Pago, WhatsApp, factura local, datos propios), y eso hoy está sin probar en producción.
7. **Tarifas del cotizador público** (`docs/COTIZACION-DIFERENCIAS.md`): hoy da entre 3 y 9 veces el precio de tu planilla por el costo de $1.500/h de máquina. Decidí cuál es la verdad y se ajusta con los tests ya escritos.
8. **CSP con nonces**: hoy el bloqueo todavía permite scripts en línea (`unsafe-inline`). Quitarlo exige renderizar todo el sitio dinámico (puede afectar el rendimiento y el scroll 3D que no quise tocar).

## Cuentas y credenciales (se piden al final, como pide el plan)
9. **Mercado Pago** (`MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`), **WhatsApp/Twilio**, **factura con proveedor certificado**: sin probar en producción.
10. **H11 insumos + Google Sheets**: cuenta de servicio de Google, planilla compartida e id (`docs/INSUMOS-SHEETS.md`).
11. **Sentry o el webhook de alertas** (`ALERT_WEBHOOK_URL`) y **monitores de uptime** (`docs/MONITOREO.md`).

## Con otras personas o herramientas
12. **Abogado**: política de privacidad, términos, consentimiento, contrato de licencia/mantenimiento (`docs/PRIVACIDAD-BORRADOR.md`).
13. **Prueba de restauración real** con `mongodump`/Atlas y anotarla (`docs/BACKUP-Y-RESTAURACION.md`); hoy solo hay chequeo lógico.
14. **Cronometrar un despliegue real** con Atlas + Render + Vercel y corregir `docs/DESPLIEGUE-REPETIBLE.md` (V4): solo está probado el arranque local desde cero.
15. **Video de 5 minutos** de la cola (V5) y **taller piloto** (V10) — sin cliente real no hay caso real (V3 demo aparte tampoco se hizo).
