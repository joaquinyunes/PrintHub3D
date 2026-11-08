# PrintHub3D (taller de impresión 3D) — plan de venta (03/11/2026)
Leé primero `..\PLAN-VENTA-10K.md` (veredicto, paquetes **S** y **V**). Rama: `main` (`f12a8bf`) + `chore/seguridad-ci` (`7388067`). Sin `git push`. **No tocar el diseño 3D de scroll** (te gusta): solo seguridad, rendimiento y a11y.

**Frase de venta (a validar):** «Cotizá, producí y entregá impresiones 3D: la cola te dice qué imprimir ahora, los operarios avanzan cada pieza con PIN y el cliente ve el estado.» Competidor a mirar: Printago.

## Estado auditado
- ✅ cola «¿Qué imprimo?» (backend Mongo + `/admin/cola`) · 77 tests según el último informe (🔎 **no re-corridos hoy**)
- 🟡 `npm audit` solo cubrió la **raíz** (0): **`backend/` y `frontend/` tienen su propio lock y nunca se auditaron**
- ☐ `chore/seguridad-ci` sin integrar · ☐ diseño/a11y nunca asignado · ☐ `/admin/cola` nunca probada en navegador
- ☐ build de Render con `npx tsc --noEmitOnError false || true` (oculta errores) · ☐ enlace público roto (503, deploys `BLOCKED`)
- ☐ 2 cambios sin commitear (`PLAN-POR-PROYECTO.md`, `docs/`) · ☐ fase 1 de 7 del plan

## A. Pasos
- [x] **H1** 🤖 Integrar `chore/seguridad-ci`. Backend `npx jest` (≥ 77) y `npx tsc --noEmit`; frontend `npx tsc --noEmit` y `npm run build`. ✅ 08/11: merge de `chore/seguridad-ci`; backend `tsc` 0 y `jest` **155/155** (20 suites; antes 77); frontend `tsc` 0, `build` OK, `vitest` 20/20.
- [x] **H2** 🤖 **S1 en `backend/` y `frontend/`** (`npm audit --omit=dev` en cada uno) → 0 críticas/altas. ✅ 08/11: backend 0 críticas / 0 altas / 2 moderadas (mercadopago→uuid); frontend 0/0/0; raíz 0. `xlsx` reemplazado por `read-excel-file` (⚠️ probar con la planilla real).
- [ ] **H3** 🤖 *(parcial: `render.yaml` ya trae `npm ci && npm run build`; el `|| true` vive en el panel de Render, que no puedo editar; el CI ahora falla si se versiona un build con `|| true` → ver `docs/PENDIENTES-DEL-USUARIO.md` #4)* **WP-07** reemplazar el build de Render `... || true` por `npm run build` (que realmente falle si no compila).
- [x] **H4** 🤖 Probar `/admin/cola` en navegador (capturas). ✅ 08/11 con navegador: piezas, PIN incorrecto/correcto, calculadora, axe; capturas en `docs/capturas/`. Encontró y se corrigió un bug (PIN erróneo mandaba al login).
- [x] **H5** 🤖 **WP-02** productos con partes → piezas automáticas. ✅ producto con `parts` → piezas automáticas al crear pedido (tests `operators.test.ts`).
- [x] **H6** 🤖 **WP-03** operarios con **PIN** (bcrypt, límite de intentos, aislamiento por taller, registro de quién avanzó cada pieza) + S3, S4, S7. ✅ operarios con PIN (bcrypt, 5 fallos = 15 min, aislamiento por taller, historial por pieza) + S3, S4 (12 car., TOTP, logout en todos los dispositivos), S7 (auditoría solo-agregar).
- [x] **H7** 🤖 **WP-05** calculadora de cotización: informe de diferencias contra `quote.pricing` y tests de regresión (dinero: cada caso con su resultado esperado). ✅ `quote.cost.ts` + `docs/COTIZACION-DIFERENCIAS.md` (el estimador público da 3–9× la planilla) + tests con resultado esperado; relleno 0 % ya no se toma como 20 %.
- [x] **H8** 🤖 **WP-06** imágenes y link de referencia en pedidos + ventas de producto, con S5 (tipo/tamaño real de archivo; los `.stl`/`.3mf` subidos nunca se ejecutan ni se sirven con el tipo equivocado). ✅ adjuntos imagen/.stl/.3mf validados por contenido, servidos como descarga; link de referencia http(s); venta manual con link/imagen.
- [x] **H9** 🤖 **WP-28** `docs/BACKOFFICE.md` contra Printago (después de H5, H6 y H8). ✅ `docs/BACKOFFICE.md`.
- [ ] **H10** 🤖 *(parcial: a11y axe 0 violaciones en 11 páginas ✅; S8 ✅, S9 ✅ (falta completar el contacto de `security.txt`), S11 ✅, S13 ✅ → `docs/SEGURIDAD.md`; **S2 🟡** CSP en bloqueo pero con `unsafe-inline`, **S10 🟡** restauración real sin probar, **S12 🟡** faltan textos legales)* Diseño y accesibilidad (no asignado antes) + S2, S8, S9, S10, S11, S12, S13.
- [ ] **H11** 🤖 *(🟡 API de insumos + sync con planilla detrás de interfaz, 6 tests ✅; lectura real de Google sin probar (faltan credenciales) y sin pantalla → `docs/INSUMOS-SHEETS.md`)* **WP-04** insumos + Google Sheets — al final, con credenciales.
- [ ] 👤 **H12** Enlace público roto `print-hub3-d.vercel.app` (503): dejar **un** proyecto de Vercel de los tres y borrar los otros · ignorar ramas `dependabot/*` en Vercel · redeploy del front en Render (hoy sin encabezados) y del backend con Atlas.

## B. Para vender (de `..\PLAN-VENTA-10K.md` §4)
- [x] V1 paquetes (`docs/VENTA-PAQUETES-Y-COSTO.md`, propuesta a validar) · [x] V2 tabla a 3 años contra Printago (USD 4/ranura, 08/11/2026): **Printago sale más barato en todos los tamaños** · [ ] V3 demo aparte · [ ] V4 despliegue repetible (🟡 guía + `scripts/smoke-test.mjs` probados en local; Atlas+Render+Vercel sin cronometrar) · [ ] V5 manual del taller (✅ `docs/MANUAL-TALLER.md`) + video de la cola (👤) · [ ] V7 uptime (🟡 alertas por webhook + guía; sin monitores creados) · [ ] V8 página de venta (🟡 `docs/venta/index.html`, axe 0; precio y contacto sin completar) · [ ] V10 taller piloto

## Salida
☑ jest/tsc/build verdes (155 + 20 tests) ☑ 0 críticas/altas en backend y frontend ☐ el enlace público da 200 ☑ cola probada (navegador) ☐ build de Render sin `|| true` (panel de Render) ☐ taller piloto

> Resumen y pendientes de Joaquín: `docs/PENDIENTES-DEL-USUARIO.md`.
