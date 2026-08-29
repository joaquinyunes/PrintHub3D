# Manual de uso — PrintHub3D

Guía rápida para el dueño y los operarios del taller.

## Primer día

1. Entrá a `/admin/login` con el usuario admin (lo creaste con `make admin`).
2. El dashboard te muestra un cartel **"Terminá de configurar tu taller"** → abrí el
   wizard (`/admin/setup`): nombre del negocio, tu WhatsApp, datos de contacto.
3. **Inventario** (`/admin/products`): cargá tus productos con precio, costo y stock.
   El costo es clave para que los reportes de rentabilidad tengan sentido.
4. **Filamento** (`/admin/filamento`): cargá tus bobinas con el costo por kg.
5. **Producción** (`/admin/production`): cargá tus impresoras. Si tenés OctoPrint,
   poné la URL y la API key para ver el estado en vivo.
6. **Inicio Web** (`/admin/home`) y **Configuración** (`/admin/settings`): editá los
   textos, imágenes y categorías de la tienda pública.

## El día a día

### Pedidos (`/admin/orders`)
- **Nuevo pedido**: cliente, productos (de inventario o "personalizado"), seña, fecha
  de entrega. Se genera un **código de seguimiento** que le pasás al cliente.
- Los estados van: Pendiente → En producción → Listo → Entregado.
- Al cambiar de estado, si el cliente tiene WhatsApp cargado, recibe un aviso
  automático (requiere Twilio configurado).
- Cuando entregás, **"Registrar venta"** cierra el pedido y lo suma a la caja.

### Producción (`/admin/production`)
- La cola muestra qué falta imprimir. Asignás cada trabajo a una impresora e indicás
  el tiempo estimado.
- Las impresoras con integración muestran el % de avance real.

### Ventas de mostrador (`/admin/ventas`)
- Para lo que se vende en el momento sin pedido: producto, cliente, forma de pago,
  total.

### Filamento (`/admin/filamento`)
- El botón **−** descuenta 100 g (o registrás el consumo real de un trabajo).
- **↻** recarga una bobina. Cuando el nivel baja del umbral, aparece una alerta.

### Cotizador (`/cotizar`, público)
- El cliente completa material, medidas y cantidad y recibe un precio estimado.
- Cada cotización enviada te llega como aviso y queda guardada.

## Ver los números

- **Reportes** (`/admin/analytics`): facturación, flujo de caja, top productos.
- **Rentabilidad** (`/admin/rentabilidad`): lo importante. Ingresos − costo de lo
  vendido − gastos = **ganancia neta**, con el **margen %** por producto. Un margen
  rojo (< 15%) es una señal de que ese producto casi no deja plata.

## Usuarios y permisos (`/admin/usuarios`, solo dueño)

- **Dueño (admin)**: ve todo, incluida la caja y la configuración.
- **Operario (staff)**: pedidos, producción, inventario, filamento y clientes.
  **No ve** ventas, gastos, reportes, rentabilidad ni configuración.
- Podés **desactivar** un operario sin borrarlo (pierde el acceso al instante).
- **Resetear clave** genera una contraseña temporal que le pasás al operario.

## Cobros online (MercadoPago)

- Con `MP_ACCESS_TOKEN` configurado, el carrito de la tienda y la página de
  seguimiento (`/track`) muestran botones de pago.
- El cliente puede **pagar el saldo** desde `/track` con su código.
- En el panel de MercadoPago hay que configurar la URL del webhook:
  `https://<tu-api>/api/payments/webhook`.

## Rastreo (`/track`)

El cliente entra su código y ve el estado, la línea de tiempo, el detalle del pedido
y el saldo pendiente. Es la pantalla que reemplaza las mil preguntas por WhatsApp.
