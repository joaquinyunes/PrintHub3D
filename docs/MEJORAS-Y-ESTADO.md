> Archivo vivo: qué se hizo y qué falta en este proyecto. Misma base que `soluciones-repos/ESTADO-PROYECTOS/printhub3d.md` (31/10/2026). Cada sesión lo actualiza al terminar.

> **Actualización 08/11/2026** — rama `feat/venta-10k`: H1, H2, H4–H9 hechos y verificados (backend 155 tests, frontend 20, `tsc`/build/lint sin errores, `npm audit` 0 críticas/altas). Parciales: H3, H10 (S2, S10, S12), V4, V7, V8. No hecho: H11. Todo lo que falta y es tuyo: `docs/PENDIENTES-DEL-USUARIO.md`. Seguridad: `docs/SEGURIDAD.md`.

# printhub3d (taller de impresión 3D) — rama `main` · `f12a8bf`

## Hecho
- Fase 1 de la integración con `_referencia/global3d-corrientes`: cola «¿Qué imprimo?» (módulo `production`, rutas `/api/production-queue`, pantalla `/admin/cola`). 77 tests de backend y `tsc` limpio informados; **no se probó en navegador**. **Commiteado hoy** (estaba sin commitear).
- Ya tenía: pedidos, productos, filamentos, ventas, cotizador, impresoras (OctoPrint).

## Falta (código) — ninguno empezado
| WP | Qué |
|---|---|
| WP-02 | Productos con **partes** → piezas automáticas |
| WP-03 | **Operarios con PIN** (bcrypt, límite de intentos, aislamiento por taller) |
| WP-04 | Insumos + sincronización con Google Sheets (necesita credenciales; se pide al final) |
| WP-05 | Calculadora: comparar con `quote.pricing` y portar diferencias |
| WP-06 | Pedidos con imágenes y link de referencia + ventas de producto |
| WP-07 | Build de Render sin `\|\| true` (esconde errores de TypeScript) |
| WP-28 | `docs/BACKOFFICE.md` contra Printago (pedidos de otros canales, enrutado a impresoras, órdenes de compra). Después de WP-02, 03 y 06 |

## Te toca a vos
1. **Enlace público roto:** `print-hub3-d.vercel.app` da 503 (deploys `BLOCKED`, incluido el de `main`). Es el enlace del repo en GitHub.
2. Dejar **un** proyecto de Vercel de los tres (`print-hub3d`, `printhub3d`, `print-hub3-d`) y borrar los otros desde el panel.
3. `printhub3d-frontend` en Render no manda encabezados de seguridad (ni HSTS) → WP-43.
4. Ignorar ramas `dependabot/*` en Vercel.
5. Cambiar el build del backend a `npm run build` (WP-07).

## Plataformas hoy
Vercel ×3 (uno roto). Render: frontend y backend (ambos gratis; arranque en frío 43 s).
