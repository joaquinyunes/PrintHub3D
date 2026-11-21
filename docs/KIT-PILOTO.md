# Kit del taller piloto (V10)

> El piloto **real no está hecho**: este kit es para armarlo. El «acuerdo de piloto» de abajo es un **borrador para revisar con un abogado** (no es asesoramiento legal).

## Qué es un piloto
Un taller usa PrintHub3D con sus pedidos reales durante **30 días**, con soporte cercano, a cambio de **uso real y permiso para contar el resultado**. Sin cliente real no hay caso real ni se puede sostener ningún precio (ver `docs/VENTA-PAQUETES-Y-COSTO.md`).

## Perfil ideal
1 a 10 impresoras, pedidos a medida, hoy en planillas y chats; que acepte el flujo pedido → piezas → cola → PIN.

## Checklist (marcar fecha y quién)
**Antes (semana 0)**
- [ ] Reunión de 30 minutos: ver `docs/venta/index.html` y la demo (`docs/DEMO.md`).
- [ ] Acuerdo de piloto firmado (borrador abajo).
- [ ] Instancia propia levantada con `docs/DESPLIEGUE-REPETIBLE.md` y `scripts/smoke-test.mjs` en «Todo en orden».
- [ ] Cuentas a nombre del taller (Atlas, Render/Vercel); proveedor como colaborador.
- [ ] Datos reales cargados: productos con sus partes, insumos, operarios con PIN.
- [ ] Administrador con 2FA activo; clave temporal eliminada.
- [ ] Capacitación de 2 h con `docs/MANUAL-TALLER.md` (opcional: el video de `docs/GUION-VIDEO.md`).
- [ ] Monitor de uptime y `ALERT_WEBHOOK_URL` configurados (`docs/MONITOREO.md`).
**Durante (semanas 1–4)**
- [ ] Llamada de 15 min por semana: qué se trabó, qué falta.
- [ ] Anotar cada falla o pedido de función en una lista con fecha (no prometer fechas).
- [ ] Medir: pedidos cargados, piezas avanzadas por PIN, tiempo para armar la cola cada mañana (antes/después, lo que el taller diga).
- [ ] Revisar los backups y una restauración (`docs/BACKUP-Y-RESTAURACION.md`).
**Cierre (semana 5)**
- [ ] Entrevista de cierre: ¿lo seguirías usando?, ¿cuánto pagarías por mes?, ¿qué falta para recomendarlo?
- [ ] Permiso por escrito para citar el resultado (con o sin el nombre del taller).
- [ ] Decisión: seguir (paquete Mensual) o salir (se exportan sus datos y se borra la instancia).

## Borrador de acuerdo de piloto (revisar con abogado)
1. **Objeto:** uso de PrintHub3D por 30 días para la gestión de pedidos del taller [NOMBRE].
2. **Precio:** [a definir por el dueño: gratis / simbólico / descuento sobre el paquete Mensual].
3. **Datos:** los datos del taller son del taller. Al terminar se le entrega una exportación y se borra la instancia en [N] días. Datos personales de sus clientes: tratamiento según `docs/PRIVACIDAD-BORRADOR.md`.
4. **Soporte:** respuesta por [canal] en [plazo a definir]; sin garantía de disponibilidad durante el piloto.
5. **Qué NO incluye:** integraciones con Mercado Pago, WhatsApp o facturación electrónica, salvo que se acuerden por escrito; licencias de terceros.
6. **Propiedad del software:** [cesión o licencia de uso: a decidir con el abogado].
7. **Referencia:** el taller autoriza [sí/no] a mencionar el resultado del piloto [con/sin nombre].
8. **Terminación:** cualquiera de las partes, con 7 días de aviso.
9. **Ley y jurisdicción:** [a completar].
