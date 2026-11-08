# PrintHub3D — paquetes, frase de venta y costo a 3 años (V1 y V2)

Fecha de los precios: **08/11/2026**. Todo precio ajeno está tomado de su sitio ese día; si pasa un mes, rehacer la tabla. Los precios propios son **una propuesta para validar con un comprador real**, no un dato de mercado.

## Frase de venta (a validar)
> «Cotizá, producí y entregá impresiones 3D: la cola te dice qué imprimir ahora, los operarios avanzan cada pieza con PIN y el cliente ve el estado.»

Para: talleres de impresión 3D a pedido (1 a 10 impresoras) que hoy llevan pedidos en planillas y chats.

## V1 — Tres paquetes (propuesta)
| Paquete | Qué incluye | Qué NO incluye |
|---|---|---|
| **Instalación** | Base propia (Atlas) + dominio + cuentas a nombre del cliente + carga de sus datos reales + capacitación de 2 h + `docs/MANUAL-TALLER.md` | Mercado Pago, WhatsApp, factura, migraciones complejas |
| **Mensual** | Hosting, backups con prueba de restauración trimestral, actualizaciones de seguridad (`npm audit` a 0 críticas/altas), soporte por escrito con tiempo de respuesta, aviso de caídas | Nuevas funciones |
| **Completo** (referencia ≈ USD 10.000) | Instalación + Mensual por 12 meses + integraciones locales (Mercado Pago, WhatsApp, factura con proveedor certificado) + migración de datos del cliente | Licencias de terceros (Twilio, AFIP, proveedor de factura) |

Importes: el **usuario los fija**. Los números de abajo sirven para saber qué se puede prometer sin perder plata, no para ponerle precio.

## V2 — Costo a 3 años (36 meses) contra Printago
**Fuente:** Printago, plan Comercial: primera ranura gratis y **USD 4 por ranura adicional por mes** (anual USD 3,67), según [docs.printago.io](https://docs.printago.io/docs/settings/subscription-management) y [printago.io/pricing](https://www.printago.io/pricing) (la página la rotula «2025 Introductory Pricing»: pueden cambiar). Una «ranura» es un trabajo simultáneo en la fila; conectar impresoras es gratis. Los 3,67 anuales los reporta la búsqueda del 08/11/2026; la página no los muestra en el texto, **confirmar antes de usarlos**.

| Ranuras (trabajos a la vez) | Printago por mes | **Printago 36 meses** (mensual) | Printago 36 meses (anual) |
|---|---|---|---|
| 5 | USD 16 | **USD 576** | USD 528 |
| 10 | USD 36 | **USD 1.296** | USD 1.189 |
| 25 | USD 96 | **USD 3.456** | USD 3.171 |
| 50 | USD 196 | **USD 7.056** | USD 6.474 |

**PrintHub3D «Completo», 36 meses** (supuestos escritos para poder cambiarlos):
| Concepto | Cuenta | USD |
|---|---|---|
| Paquete Completo (incluye 12 meses de mantenimiento) | propuesta de referencia | 10.000 |
| Hosting 36 meses, tope | Render (2 servicios Starter, ≈ USD 7 c/u, **verificar en render.com/pricing**) + Atlas Flex (tope USD 30/mes según [la documentación de MongoDB](https://www.mongodb.com/docs/atlas/billing/atlas-flex-costs.md)) = ≈ USD 44/mes × 36 | 1.584 |
| Mantenimiento meses 13 a 36 | **supuesto** USD 120/mes × 24 | 2.880 |
| **Total** | | **≈ 14.464** |

### Qué dice la tabla (sin maquillaje)
- **A igual función de «gestionar la cola», Printago sale más barato en todos los tamaños de la tabla**: incluso con 50 ranuras son USD 7.056 contra ≈ USD 14.464.
- El Completo recién empataría con Printago a partir de **unas 100 ranuras simultáneas** (14.464 ÷ 36 ÷ 4 + 1), es decir, una granja enorme. No es el cliente de este producto.
- Por lo tanto **USD 10.000 no se justifica por costo**. Se justifica solo si el cliente valora lo que Printago no muestra: cotización a medida, Mercado Pago, WhatsApp, factura local, sus datos en su propia base y soporte en español, **y esas integraciones están sin probar en producción**.
- Consecuencia práctica: no ofrecer el Completo primero. Empezar por **Instalación + Mensual** a un taller piloto, con las integraciones que ese taller realmente use, y recién después armar el paquete grande con un caso real.

Lo que esta tabla **no** incluye: el tiempo del dueño del taller, comisiones de Mercado Pago, costos de Twilio/AFIP, ni el valor de tener los datos propios.
