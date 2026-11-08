# H11 — Insumos y Google Sheets (WP-04): NO hecho, necesita credenciales

Estado al 08/11/2026: **no implementado**. Se dejó para el final porque depende de cuentas y claves del usuario y no se pueden probar sin ellas (regla del plan: las credenciales se piden al final).

## Qué es
1. **Insumos**: llevar el stock de lo que no es filamento (argollas, imanes, cajas, lijas) y descontarlo al producir, igual que hoy el filamento.
2. **Google Sheets**: sincronizar con la planilla del taller (la «Calculadora_3D_GLOBAL3D» y el stock) en vez de importar el Excel a mano (hoy existe «Importar planilla»).

## Lo que hace falta de parte del usuario (👤)
- Una **cuenta de servicio de Google Cloud** con la API de Google Sheets activada, y el JSON de la clave (se carga como variable de entorno del backend, **nunca** en el repo).
- Compartir la planilla del taller con el correo de esa cuenta de servicio.
- El **id de la planilla** y los nombres de las hojas/columnas a sincronizar (hoy: «Pedidos», «Ventas Productos», «Ventas Filamento», «Stock Sync»).
- Decidir el sentido: ¿la planilla manda (solo lectura) o se escribe de vuelta?

## Diseño propuesto (cuando lleguen las credenciales)
- Colección `supplies` (tenant, nombre, unidad, stock, mínimo) + movimientos (igual que `inventory-movement`) + el producto indica cuántos insumos usa por unidad (`product.supplies[]`), que se descuentan al empezar a imprimir.
- Sincronización de **solo lectura** al principio (planilla → base) con `google-auth-library` (ya está en las dependencias), disparada a mano desde el panel y con un reporte de diferencias antes de aplicar.
- Tests con una planilla de prueba y verificación de que una fila mal formada no rompe el resto.
