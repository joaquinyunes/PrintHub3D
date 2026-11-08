# Plan de este proyecto (copia del 02/11/2026)

> Sacado de `soluciones-repos/PLAN-POR-PROYECTO.md` (la maestra, con tablero y reglas de todas las sesiones). Marcá `[x]` acá y en la maestra. Reglas: sin `git push`, sin secretos, credenciales de prueba al final, no tocar `veterinaria-system`.

## 11. printhub3d (taller 3D)
Ramas: `main` `f12a8bf` (cola «¿Qué imprimo?») · `chore/seguridad-ci` `7388067`.

- [ ] 1 🤖 **Integrar** `chore/seguridad-ci`. Verif.: backend `npx jest` (≥77) y `npx tsc --noEmit`; frontend `npx tsc --noEmit` y `npm run build`.
- [ ] 2 🤖 Probar `/admin/cola` en navegador (nunca se hizo).
- [ ] 3 🤖 **WP-07** reemplazar el build de Render `npx tsc --noEmitOnError false || true` por `npm run build` (verificar que compila).
- [ ] 4 🤖 **WP-02** productos con partes → piezas automáticas.
- [ ] 5 🤖 **WP-03** operarios con PIN (bcrypt, límite de intentos, aislamiento por taller, registro de quién avanzó cada pieza).
- [ ] 6 🤖 **WP-05** calculadora: informe de diferencias contra `quote.pricing` y tests de regresión.
- [ ] 7 🤖 **WP-06** imágenes y link de referencia en pedidos + ventas de producto.
- [ ] 8 🤖 **WP-28** `docs/BACKOFFICE.md` contra Printago (después de 4, 5 y 7).
- [ ] 9 🤖 **WP-04** insumos + Google Sheets — al final, con credenciales.
- [ ] 10 🤖 Diseño y accesibilidad (no asignado antes).
- [ ] 11 👤 **Enlace público roto** `print-hub3-d.vercel.app` (503, deploys `BLOCKED`): dejar **un** proyecto de Vercel de los tres y borrar los otros.
- [ ] 12 👤 Ignorar ramas `dependabot/*` en Vercel.
- [ ] 13 👤 Redeploy del front en Render (hoy no manda ningún encabezado) y del backend con Atlas.

Salida: ☐ jest/tsc/build verdes ☐ el enlace público da 200 ☐ cola probada ☐ build de Render sin `|| true`.

Pasos 🤖 = los hace una sesión. 👤 = solo el dueño.
