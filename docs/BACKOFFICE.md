# Back-office de PrintHub3D contra Printago (WP-28)

Fecha: 08/11/2026. Fuentes de Printago: [printago.io](https://www.printago.io), [printago.io/pricing](https://www.printago.io/pricing) y [docs.printago.io](https://docs.printago.io/docs/settings/subscription-management). Lo de PrintHub3D está verificado en el código y en las pruebas de este repo; lo de Printago es lo que dicen sus páginas públicas (no lo probé con una cuenta).

## Qué es cada uno
- **Printago**: software en la nube para **granjas de impresión** que venden por tienda online. Su fuerte es conectar tiendas (Shopify, Etsy, eBay, WooCommerce, Wix), repartir los trabajos entre muchas impresoras de marcas mezcladas y encadenarlos automáticamente.
- **PrintHub3D**: gestión de un **taller** que cotiza, produce y entrega a pedido: pedido → piezas → cola «¿Qué imprimo?» → operarios con PIN → seguimiento del cliente, con cobro por Mercado Pago y WhatsApp.

## Matriz
| Función | Printago (según su sitio) | PrintHub3D (hoy) | Brecha |
|---|---|---|---|
| Pedidos desde otros canales | Shopify, Etsy, eBay, WooCommerce, Wix, ShipStation; auto-impresión | Pedido manual en el panel, pedido público de la tienda propia, importación de planilla Excel | **Falta**: conectores de tienda. Lo más pedido localmente sería Tiendanube/Mercado Libre (no verificado con clientes) |
| Producto con varias partes | SKUs con ensambles y cantidades | **Sí (H5)**: el producto guarda sus partes (nombre, color, cantidad) y al crear el pedido salen solas las piezas × cantidad | Igual de cubierto para el caso de un taller |
| Cola de producción | Motor de cola que asigna cada trabajo a una impresora capaz y balancea la flota | **Cola «¿Qué imprimo?»**: piezas agrupadas por color o cliente, lo más urgente primero, con vencimientos | **Falta** asignación automática a impresoras: hoy la persona elige qué imprime |
| Operarios | Permisos por usuario, historial de quién imprimió qué | **Sí (H6)**: operarios con PIN (bcrypt, 5 fallos = 15 min de bloqueo, aislados por taller) y cada avance de pieza queda con su autor y fecha; registro de auditoría que nadie puede borrar | Equivalente en lo esencial; sin roles finos más allá de admin/staff |
| Flota de impresoras | Bambu, Prusa, Creality, Snapmaker, Elegoo, Klipper; agrupación y calibración masiva | Impresoras con estado; integración en vivo solo con **OctoPrint** (por impresora) | **Falta** Bambu/Klipper nativo y control masivo |
| Filamento / insumos | Qué carrete hay en qué impresora; retiene el trabajo si falta material | Stock de filamento con descuento al empezar a imprimir; **no** hay carrete por impresora | **Falta** carrete-por-impresora; insumos generales y planilla de Google: H11, ver `docs/INSUMOS-SHEETS.md` |
| Cotización | No figura en su sitio | **Sí**: cotizador público desde medidas + calculadora de costo de la planilla del taller (H7) | Ventaja propia (ver `docs/COTIZACION-DIFERENCIAS.md`: las tarifas del cotizador público hay que validarlas) |
| Órdenes de compra a proveedores | No figura en su sitio | **No** | Falta en ambos; candidato a una próxima etapa |
| Adjuntos del pedido | Archivos y slicing en la nube (5 GB) | **Sí (H8)**: fotos y modelos .stl/.3mf validados por contenido (nunca se ejecutan; se bajan como binario), más link de referencia | Sin slicing en la nube |
| Cobro y facturación local | No (mercado de EE. UU.) | Mercado Pago (preferencia + webhook con firma), factura electrónica por AFIP en preparación (necesita proveedor certificado) | Ventaja local, **sin probar en producción** (faltan credenciales) |
| Aviso al cliente | No figura | WhatsApp (Twilio) y seguimiento por código | Ventaja local, sin credenciales probadas |
| Análisis | Producción, materiales, rentabilidad | Reportes, rentabilidad, gastos | Parecido |
| Precio | Gratis 1 slot; USD 4 por slot adicional por mes (comercial) | Venta única + mantenimiento (ver `docs/VENTA-PAQUETES-Y-COSTO.md`) | Ver tabla de costo a 3 años |

## Lectura honesta
1. Para un **taller chico o mediano** que cotiza a medida y entrega a clientes, el flujo pedido → piezas → cola → entrega está cubierto de punta a punta, con control de quién hizo cada pieza.
2. Para una **granja** que vive de tiendas online y tiene muchas impresoras de marcas distintas, Printago está por delante (conectores y asignación automática) y es **mucho más barato por mes** (ver tabla de costo).
3. Lo que PrintHub3D tiene y Printago no muestra: cotización, Mercado Pago, WhatsApp, factura local, datos en tu propia base. Esa es la razón de venta real, y todavía **no está probada en producción**.

## Qué construir después (en este orden, solo si hay un cliente que lo pida)
1. Conector de **Tiendanube** (pedidos entran solos a la cola).
2. Carrete de filamento por impresora y aviso de falta de material.
3. Asignación sugerida de piezas a impresoras libres (sin automatizar el arranque).
4. Órdenes de compra de filamento/insumos.
