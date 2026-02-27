## Roadmap SaaS para PrintHub3D

Este roadmap asume la base técnica propuesta en el plan (monolito modular, multi‑tenant, colas y config centralizada) y la extiende hacia un producto SaaS listo para vender.

---

### Fase 0 – Fundaciones SaaS (1–2 sprints)

- **Cuenta y tenant**
  - Modelo `Account`/`Tenant` separado de `User` (un `Account` puede tener varios `User`).
  - Flujos de alta de cuenta: `sign‑up`, verificación de email y creación automática de `tenantId`.
  - Asociación estricta de todos los datos (`Orders`, `Products`, `Clients`, `Chats`, `Printers`, `Settings`, `Sales`, `Expenses`) al `tenantId` del account.
- **Autenticación y autorización**
  - JWT con `tenantId` + `role` (`owner`, `manager`, `operator`, `viewer`).
  - Pantalla y API para invitar usuarios al tenant (envío de invitaciones y asignación de rol).
  - Middleware de autorización por rol/capabilidad (no solo `adminOnly`).
- **Planes y límites básicos**
  - Modelo `Plan` con límites por tenant (usuarios, impresoras, pedidos/mes, almacenamiento de archivos).
  - Asignación de plan al tenant (`free`, `pro`, `enterprise`) y enforcement suave de límites (warnings + hard‑limit).

---

### Fase 1 – Facturación recurrente y autoservicio (2–3 sprints)

- **Integración con pasarela de pagos (Stripe/Paddle)**
  - Crear `Checkout` self‑service: elección de plan, alta de tarjeta y facturación recurrente.
  - Webhooks de facturación: alta/baja/suspensión de tenants y actualización de plan/estado de pago.
  - Generación y almacenamiento de facturas (PDF/links de la pasarela) por tenant.
- **Gestión de suscripción dentro de la app**
  - Pantalla “Mi suscripción” para el owner: plan actual, próximos cobros, histórico de pagos, cambio de plan.
  - Mecanismo de downgrade/upgrade con prorrateo gestionado por la pasarela.
  - Estado de cuenta visible en la UI (activa, en gracia, suspendida) con mensajes claros.
- **Onboarding guiado**
  - Wizard de primeros pasos por tenant: completar `Settings`, conectar WhatsApp, crear impresoras, cargar primeros productos.
  - Checklists y tips contextuales para acelerar el time‑to‑value.

---

### Fase 2 – Portal de cliente y autoservicio (2–3 sprints)

- **Portal de cliente autenticado**
  - Login de cliente final vinculado a `Client` + `tenantId` (no al tenant del sistema).
  - Vistas para clientes: listado de pedidos, detalle con tracking, descarga de archivos adjuntos y facturas.
  - Acción “repetir pedido” y “solicitar nueva cotización” desde el histórico.
- **Flujos de cotización**
  - Estados adicionales para `Orders`: `draft`, `quoted`, `confirmed`, `in_production`, `ready`, `delivered`, `cancelled`.
  - UI específica para crear cotizaciones (precios desglosados, vigencia, condiciones).
  - Aprobación del cliente desde el portal (o enlace público firmado) que transforma la cotización en pedido confirmado.
- **Comunicación automatizada multi‑tenant**
  - Plantillas de WhatsApp/email configurables por tenant para cada estado de pedido.
  - Reglas de notificación por canal (solo WhatsApp, solo email, ambos) configuradas en `Settings` por tenant.

---

### Fase 3 – API pública y ecosistema (2–3 sprints)

- **API pública multi‑tenant**
  - Emisión de API keys por tenant (con scopes y rotación).
  - Endpoints documentados (OpenAPI): creación de pedidos, consulta de estados, gestión de productos y stock.
  - Rate limiting por tenant y por API key.
- **Webhooks y eventos de dominio**
  - Configuración de webhooks por tenant: `order.created`, `order.statusChanged`, `sale.created`, `client.created`.
  - Firma de webhooks y reintentos con backoff.
  - Consola de delivery en la UI (últimos intentos, estado, errores).
- **SDKs y ejemplos**
  - SDK ligero (TypeScript/JavaScript) y ejemplos para integrarse desde tiendas online (Shopify, WooCommerce, custom frontends).

---

### Fase 4 – Escalabilidad de negocio y features premium (continuo)

- **Analytics multi‑tenant avanzados**
  - Dashboards por tenant con cohortes de clientes, LTV, canales de adquisición y rentabilidad por tipo de trabajo/material.
  - Exportación a CSV/Excel de pedidos, clientes, productos y métricas.
- **Marketplace y extensiones**
  - Hooks para plugins por tenant (por ejemplo, calcular tiempo/coste desde un slicer externo).
  - Integraciones pre‑hechas con CRMs, ERPs ligeros o herramientas de marketing (Mailchimp, WhatsApp Business API).
- **Operación y confiabilidad SaaS**
  - Backups automáticos por tenant (o al menos filtrables por tenant para restauraciones parciales).
  - Logs y auditoría por tenant (quién cambió qué y cuándo) visibles para el owner.

