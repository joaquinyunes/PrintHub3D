# Cotización: `quote.pricing` (estimador público) vs. planilla del taller (calculadora de costo)

Fecha: 06/11/2026. Código: `backend/src/modules/quotes/quote.pricing.ts` (estimador) y `quote.cost.ts` (calculadora portada de `global3d-corrientes/src/features/calculator/calculator.ts`, que reproduce la planilla «Calculadora_3D_GLOBAL3D»). Tests con resultado esperado fijo: `backend/tests/quote.cost.test.ts`.

## Qué hace cada una
| | Estimador (`quote.pricing`) | Calculadora de costo (`quote.cost`) |
|---|---|---|
| Entrada | medidas (caja), solidez, relleno, material, cantidad, acabado, urgente | **gramos y horas del slicer**, insumos extra, multiplicador elegido |
| Peso | estimado: volumen de la caja × densidad × fracción de material | dato real del slicer |
| Tiempo | estimado: gramos ÷ 13 g/h | dato real del slicer |
| Filamento | tabla fija por material ($22.000–45.000/kg) | **precio del taller** por kg |
| Máquina | **$1.500/h fijos** (todo incluido) | luz (W × $/kWh) + desgaste (repuestos ÷ vida útil) |
| Margen de error | no | sí (% configurable, 5 % en la planilla) |
| Multiplicador | fijo 2,3 | elegido por la persona (×2 a ×5 según volumen/pieza) |
| Insumos no impresos | no | sí, ×1,3 |
| Mano de obra | $2.500 de armado + $800 por unidad, **sin margen** | no incluida (va en el multiplicador) |
| Precio mínimo | $3.000 por unidad | no |
| Redondeo | a $500 | a centavos |
| Precio MercadoLibre | no | sí (multiplicador + recargo) |
| Quién lo usa | público (`/cotizar`) y lead al taller | personal del taller (`POST /api/quotes/cost`, staff/admin) |

## Diferencia de dinero (mismas piezas, mismo peso y horas)
Ajustes de la planilla: kWh $140, 100 W, vida útil 3.000 h, repuestos $150.000, error 5 %.

| Pieza | Estimador (total) | Costo planilla | Planilla ×2,3 | Planilla ×4 | Planilla ML ×4 |
|---|---|---|---|---|---|
| PLA 80×80×60 normal 20 % ×1 (138 g, 10,6 h) | $47.000 | $3.900,12 | $8.970,28 | $15.600,48 | $18.720,58 |
| PLA 10×10×10 hueco 0 % ×1 (1 g, 0,1 h) | $6.500 | $29,82 | $68,59 | $119,28 | $143,14 |
| PETG 100×60×40 sólido 100 % ×2 (244 g, 18,8 h) | $163.000 | $7.924,56 | $18.226,49 | $31.698,24 | $38.037,89 |

**Conclusión:** con las tarifas actuales el estimador público da **entre 3 y 9 veces** el precio de la planilla en piezas normales (con ×4 y ×2,3), y más en piezas diminutas por el mínimo de $3.000. La causa es una sola: `machinePerHour = 1500`. La planilla cuenta ≈ $64 por hora de máquina ($14 de luz + $50 de repuestos); el estimador cobra $1.500, que es un número redondo sin fuente. Además el estimador agrega $2.500 de armado + $800 por unidad y un mínimo de $3.000 por unidad, que no existen en la planilla.

## Qué se portó y qué no (decisión)
- **Portado y probado:** las fórmulas de la planilla (`costQuote`), con las 3 filas reales de la planilla como casos de regresión, el caso `vida útil = 0` y entradas inválidas (negativas/NaN cuentan 0: nunca precio negativo).
- **Corregido en el estimador:** el relleno `0 %` se tomaba como `20 %` (`Number(x) || 20`); ahora un 0 se respeta y 20 es solo el valor por defecto cuando no viene el dato. Impacta el precio de una pieza hueca (114 g en vez de 138 g para la pieza base).
- **NO cambiado (decisión del dueño 👤):** las tarifas del estimador público (`$1.500/h`, margen 2,3, armado $2.500, mínimo $3.000). Cambiar el precio que ve el cliente es una decisión comercial. Para decidir: cargar el costo real de una hora de máquina del taller (alquiler, sueldo, amortización de la impresora) y el margen deseado. Si se confirma que la planilla es la verdad, bajar `machinePerHour` y recalcular los 5 casos de `quote.cost.test.ts` (están escritos para detectar justo ese cambio).
- **Pendiente:** que las tarifas del estimador salgan de «Ajustes» del taller en vez de estar fijas en el código (hoy todos los talleres cobran igual).
