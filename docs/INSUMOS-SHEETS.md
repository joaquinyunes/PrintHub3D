# H11 — Insumos y Google Sheets (WP-04)

Estado al 08/11/2026: **el backend de insumos y la sincronización están hechos y probados con una planilla de prueba; la lectura real de Google está escrita pero SIN probar (faltan credenciales); no hay pantalla.**

## Qué está hecho (`backend/src/modules/supplies`)
- **Insumos** (argollas, imanes, cajas, lijas): nombre, unidad, stock, mínimo. El nombre no se repite aunque cambien tildes, mayúsculas o espacios («Imán» = «iman »).
- API `/api/supplies`:
  - `GET /` — lista con la marca `low` (stock ≤ mínimo). Personal y admin.
  - `POST /`, `PATCH /:id` — alta y edición, solo admin.
  - `POST /:id/adjust` `{delta, reason?}` — entrada o salida de stock (personal y admin). **Atómico y condicional: nunca queda negativo** (409 si no alcanza), aun con dos ajustes simultáneos; queda en la auditoría.
  - `POST /sync` `{apply?}` — solo admin. Sin `apply` **solo informa** lo que cambiaría; con `apply: true` lo aplica.
- **Sincronización detrás de una interfaz** (`SheetsSource.readRows()`), igual que se hizo con la facturación: los tests usan una planilla falsa y no tocan Google.
  - La planilla es de **solo lectura**: nunca se escribe en ella y **nunca se borran** insumos que no estén en ella.
  - Columnas: `INSUMO | UNIDAD | STOCK | MÍNIMO` (la fila de títulos se ignora; acepta «1.200,5»).
  - Filas inválidas (sin nombre, stock no numérico, nombre repetido) se **informan con su número de fila y no se aplican**; el resto sí.
  - Sin credenciales responde `501 SHEETS_NOT_CONFIGURED`; si Google falla, `502` con un mensaje accionable.
- Tests: `backend/tests/supplies.test.ts` (6).

## Lo que falta
1. **Credenciales (👤)** — una cuenta de servicio de Google Cloud con la API de Sheets activada; compartir la planilla con su correo; cargar en el backend:
   - `GOOGLE_SHEETS_ID` (id de la planilla), `GOOGLE_SHEETS_RANGE` (ej. `Insumos!A:D`), `GOOGLE_SERVICE_ACCOUNT_JSON` (el JSON de la clave, **como variable de entorno, nunca en el repo**).
2. **Probar contra Google** con la planilla real: `POST /api/supplies/sync` sin `apply` y mirar el informe. Hasta entonces `GoogleSheetsSource` es código sin probar.
3. **Pantalla** «Insumos» en el panel (hoy solo hay API).
4. **Descuento automático al producir** (el producto indica cuántos insumos usa por unidad): no se hizo; hoy los insumos se descuentan a mano con `/adjust`.
5. Decidir si la planilla manda siempre (hoy `apply` pisa el stock del sistema con el de la planilla) o solo para la carga inicial.
