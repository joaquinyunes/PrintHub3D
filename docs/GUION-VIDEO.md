# Guion del video de la cola (5 minutos) — V5

> El video **no está grabado** (se graba con la instancia del cliente real o con la demo de `docs/DEMO.md`). Este es el guion para grabarlo de una sola toma. Pantalla en 1280×720; usar la demo, **nunca** el entorno real.

| Min | Pantalla | Qué decir (resumen) |
|---|---|---|
| 0:00 | Panel → Inventario → producto «Dragón articulado (demo)» | «Cada producto sabe de qué partes se arma: cabeza roja ×1, cuerpo negro ×2, cola roja ×1.» |
| 0:40 | Pedidos → pedido nuevo con ese producto ×2, fecha de entrega, link de referencia y una foto | «Al crear el pedido las piezas salen solas; la foto y el link quedan con el pedido.» |
| 1:30 | «¿Qué imprimo?» por color | «Lo más urgente primero. Agrupado por color para cambiar el carrete lo menos posible.» Mostrar «Atrasado», «Hoy», «Mañana». |
| 2:20 | Tocar «Empezar» en una pieza → pide PIN → PIN equivocado (mensaje) → PIN correcto | «Cada persona se identifica con su PIN. Con 5 errores se bloquea 15 minutos.» |
| 3:10 | La cola mostrando «último movimiento: Lucía» | «Queda registrado quién empezó cada pieza y cuándo.» |
| 3:40 | Operarios (como admin): alta, cambio de PIN, desactivar | «El PIN no se puede ver, solo cambiar.» |
| 4:10 | Calculadora de costo con una pieza real | «Gramos y horas del slicer → precio, y precio para MercadoLibre.» |
| 4:40 | Seguimiento del cliente (página pública con el código) | «El cliente ve el estado sin llamar.» Cierre: «Todo en tu propia base.» |

Antes de grabar: correr `npm run seed:demo-taller` (resetea la demo), borrar cookies y verificar que el cartel «ENTORNO DE DEMOSTRACIÓN» se vea.
Después: subirlo a una carpeta del cliente y enlazarlo en `docs/MANUAL-TALLER.md`.
