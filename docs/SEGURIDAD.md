# Seguridad de PrintHub3D — informe (S13) y política de reporte

Fecha: 08/11/2026. Revisión hecha leyendo el código nuevo de esta etapa con la guía de la skill `security-review` (modo «alta confianza»; sin agentes aparte) y las pruebas automáticas. **No es una auditoría externa ni un pentest.**

## Estado por punto del paquete S
| | Qué | Estado | Evidencia |
|---|---|---|---|
| S1 | `npm audit --omit=dev` en 0 críticas/altas | ✅ **backend 0 críticas / 0 altas / 2 moderadas; frontend 0/0/0** (antes: backend 1 crítica + 11 altas; frontend 1 crítica + 6 altas) | corrido el 08/11/2026; ver «Dependencias» |
| S2 | CSP en bloqueo | ✅ **con nonce por pedido** (`frontend/src/proxy.ts`): `script-src 'self' 'nonce-…' 'strict-dynamic'`, **sin `'unsafe-inline'` ni `unsafe-eval`** en producción; el HTML que sirve el servidor trae nonce en todos sus scripts (14 de 14 con nonce en la home). Revisado en navegador: 0 violaciones en tienda, cotizador y login, y el hero 3D carga. `style-src` mantiene `'unsafe-inline'` (atributos `style=`; riesgo menor). Costo: las páginas pasan a renderizarse en cada pedido (ya no son estáticas) | verificación manual en navegador + `scripts/smoke-test.mjs` (exige nonce y que no haya `unsafe-inline`). ⚠️ La herramienta de navegador no permitió probar que el navegador *bloquea* un script inyectado (ignora la CSP al evaluar): lo que se verificó es la cabecera, el nonce en el HTML y la ausencia de violaciones |
| S3 | Límites de intentos | ✅ login (ya había), PIN (por operario: 5 fallos = 15 min; por IP: 30/15 min), pedidos públicos y opiniones (20/10 min), cotización pública, webhook de Mercado Pago (120/min), pago (ya había). Bloqueo de cuenta tras 5 contraseñas o códigos 2FA erróneos | `middlewares/rateLimiter.ts`, tests `operators`, `auth-security` |
| S4 | Contraseñas, 2FA, sesión | ✅ bcrypt; **≥ 12 caracteres para admin/staff** (≥ 8 clientes); **TOTP (RFC 6238)** probado con los vectores de la RFC; **cerrar sesión en todos los dispositivos**; token de sesión por defecto 7 días (antes 30); cookies `HttpOnly`, `Secure` en producción. ⚠️ `SameSite=None` en producción (el front y la API están en dominios distintos): mitigado con CORS cerrado | `utils/totp.ts`, `auth/two-factor.routes.ts` |
| S5 | Validación en el borde | ✅ zod en pedidos, productos, operarios, cotización; operadores `$` bloqueados por `sanitizeInput` y por tipos; adjuntos validados **por contenido** (imagen por magic bytes; .stl: binario con tamaño exacto o ASCII `solid…facet…endsolid`; .3mf: ZIP con `[Content_Types].xml`, `3D/3dmodel.model` y fin de directorio), tope de 50 MB; los modelos se sirven **siempre** como `application/octet-stream` + `attachment` + `nosniff` + `CSP: sandbox`; nunca se abren ni descomprimen en el servidor. URLs de referencia solo `http(s)` | `utils/modelFile.ts`, test `attachments` |
| S6 | Webhooks | ⏳ fuera del alcance de esta etapa (la firma de Mercado Pago ya se verifica: test `payments-webhook`); solo se sumó el límite por minuto. Idempotencia por evento: no revisada |  |
| S7 | Roles y auditoría | ✅ admin/staff/operario; registro de auditoría **solo-agregar** (el modelo rechaza actualizar y borrar; no hay endpoint de escritura) de: alta/baja de operarios, bloqueos, avances de pieza, cambios de **precio/costo/stock**, altas/cambios de usuarios, 2FA, adjuntos, exportación y supresión de clientes. ⚠️ Un administrador con acceso directo a la base sigue pudiendo editar el registro (es la misma base) | `modules/audit`, tests |
| S8 | Secretos | ✅ **historial completo escaneado** (112 commits, 10 patrones: claves privadas, AWS, GitHub, Stripe, Mercado Pago, JWT, Google, Slack, URL de base con clave, asignaciones de secreto): **0 hallazgos reales** (1 falso positivo: una contraseña de prueba en un test). Solo `.env.example` está versionado. CI ahora corre gitleaks sobre el historial. No hubo claves que rotar | script propio (Python); no había gitleaks instalado |
| S9 | CORS y encabezados | ✅ API: CORS cerrado a `CLIENT_URL` (test con origen ajeno), HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; web: lo mismo + CSP; `/.well-known/security.txt` (⚠️ el contacto está sin completar a propósito: 👤) | tests `auth-security`; `scripts/smoke-test.mjs` |
| S10 | Backups y restauración | 🟡 backups configurados; **restauración real con `mongodump` sin probar** (falta Docker/Atlas); chequeo lógico 22/22 OK | `docs/BACKUP-Y-RESTAURACION.md` |
| S11 | Dependabot / CI | ✅ semanal, agrupado (ya estaba); `npm audit --audit-level=high` **ahora corta el CI**; `frontend/vercel.json` ignora el build de ramas `dependabot/*` | `.github/workflows/ci.yml` |
| S12 | Datos personales | 🟡 exportar y suprimir datos de un cliente (probado), logs sin emails completos ni nombres de clientes; **faltan los textos legales y el consentimiento (👤 abogado)** | `docs/PRIVACIDAD-BORRADOR.md` |
| S13 | Revisión final | ✅ hecha (ver abajo) | este archivo |

## Revisión de la etapa (hallazgos y qué se hizo)
1. **2FA esquivable por otros caminos de login — ALTA, corregido.** El login por código de email (`/api/auth/magic/verify`) y el de Google no comprobaban `totpEnabled`: quien tuviera acceso al correo del administrador entraba sin contraseña ni código aunque tuviera 2FA. Ahora ambos devuelven 403 (`OTP_REQUIRED`) si la cuenta tiene 2FA. Probado en `auth-security.test.ts`. *(Lo detectó esta revisión, no las pruebas anteriores: pasó a la rama por un parche incompleto.)*
2. **Un 401 de PIN mandaba al login — corregido** (se vio en el navegador): un PIN incorrecto devolvía 401 y el front lo interpreta como «sesión vencida». Ahora 403.
3. **Gaps que quedan, conocidos y sin corregir:**
   - La cuenta de administrador **sin 2FA activado** sigue pudiendo entrar con contraseña o con código de email (el código por email no pide contraseña: es el diseño anterior). Recomendación: activar 2FA en todo admin; si se quiere, desactivar el login por código de email para admin/staff.
   - Tokens de sesión emitidos **antes** de esta versión no tienen versión (`tv`) y no se invalidan con «cerrar sesión en todos los dispositivos» hasta que vencen (máx. 30 días). Se resuelve solos con el tiempo o rotando `JWT_SECRET`.
   - El secreto TOTP queda en la base en texto (con `select: false`, nunca sale en respuestas). Cifrarlo con una clave aparte es una mejora posterior.
   - La exportación/supresión busca los pedidos **por nombre de cliente**: dos clientes con el mismo nombre en un taller se mezclan. Hay que desambiguar por id en el modelo antes de usar la supresión con volumen.
   - Los adjuntos se leen en memoria (hasta 50 MB por subida) y `/uploads/<nombre>` es público (el nombre es aleatorio, 64 bits). Un archivo de cliente es accesible para quien tenga el enlace.
   - Los límites de intentos viven en memoria de cada instancia (si se escalan varias instancias, no se comparten).

## Revisión adversaria de nuestro propio código (19/11/2026)
Método: para cada punto se escribió **primero la prueba que ataca** (`backend/tests/adversarial.test.ts`, 19 pruebas) y se comprobó que fallaba contra el código anterior (las 4 de stock/venta se corrieron contra el código viejo: fallaban; el resto falló en la primera corrida); después se arregló.
| # | Hallazgo | Severidad | Arreglo |
|---|---|---|---|
| 1 | **CSRF**: la sesión va en cookie con `SameSite=None`; otro sitio podía disparar POST «simples» sin cuerpo (vender un producto, registrar una venta, subir archivos con multipart, cerrar sesiones) con la cookie de quien estuviera logueado | Alta | Guarda en `app.ts`: con sesión por cookie (sin `Authorization`), si el `Origin`/`Referer` no es de nuestro front → 403. Los webhooks y las llamadas con Bearer no se ven afectados |
| 2 | **Webhook de Mercado Pago no idempotente**: 5 avisos simultáneos del mismo pago registraban **5 ventas**; repetir un pago de saldo lo acreditaba dos veces | Alta | Reclamo atómico por id de pago (`processedPayments`) y actualización atómica del saldo con tope en el total; si falla, se libera para el reintento |
| 3 | **Una seña (50 %) marcaba el pedido como pagado y registraba la venta completa** (ingresos inflados, y «paid: true» en la API) | Alta (lógica de dinero) | La venta se registra recién cuando lo pagado cubre el total; el saldo la cierra una sola vez |
| 4 | **Venta de más stock del que hay**: dos pedidos simultáneos vendían la misma unidad; dos renglones del mismo producto esquivaban el tope; el stock podía quedar negativo | Media | Reserva atómica (`stock >= cantidad` y descuento en una sola operación), suma por producto y devolución si algo falla |
| 5 | **Producto oculto (`isPublic: false`) se podía pedir desde la tienda pública** conociendo su id | Media | La tienda pública solo vende productos publicados |
| 6 | **Doble clic / dos requests a la vez en «registrar venta del pedido»** creaban dos ventas | Media | Reclamo atómico del pedido |
| 7 | **IDOR entre talleres**: un admin de otro taller podía editar/borrar tareas e ideas/impresoras de la home por id, **mover una tarea a su taller** (mass assignment de `tenantId`), y dejar «imprimiendo» una impresora ajena al iniciar un pedido | Media (si hay más de un taller en la instancia) | Todo filtra por el taller del token y solo acepta los campos permitidos |
| 8 | **Código de acceso por email (6 dígitos) sin tope de intentos** | Media | Limitador propio: 10 intentos fallidos / 15 min por IP |
| 9 | **Enumeración de cuentas**: «Usuario no encontrado» vs «Contraseña incorrecta» y contador de intentos | Baja | Mismo mensaje y sin contador |
| 10 | Objetos `{$ne:null}` en forgot-password / verify-email / magic respondían 500 (no era inyección: el saneador renombra `$`, pero el 500 además dispara la alerta) | Baja | Validación de tipo (string) y 400; prueba de regresión |
| 11 | Enlace de la cotización pública sin validar (`javascript:`) | Baja (hoy no se muestra en la UI) | Solo `http(s)` o `/uploads/…` |
| 12 | La tienda pública usaba un taller fijo (`global3d_hq`) en vez del de la instancia | Baja (rompía la demo y las instancias de clientes) | Usa `DEFAULT_TENANT_ID` |

Revisado y **sin hallazgos**: roles en todas las rutas (se listaron las que no llevan `protect`: solo las públicas esperadas), API keys (hash SHA-256, alcance por taller), firma del webhook (HMAC en tiempo constante; sin secreto en producción rechaza), búsqueda por código de seguimiento (regex escapado), secretos (134 commits, 0 reales), subidas (nombres aleatorios, tipos por contenido).
**Quedan conocidos, sin arreglar:** el seguimiento público (`/api/orders/track/<código>`) devuelve también las `notas` del pedido, que a veces son internas (decisión de producto); los límites de intentos viven en memoria de cada instancia; el 2FA es opcional.

## Dependencias — actualización 19/11/2026
- **Apareció una crítica nueva** (`mongoose` 9.0–9.11.3: `sanitizeFilter` no se aplicaba en algunas consultas). Se pasó a `mongoose` **9.12.2** y `npm audit --omit=dev` volvió a **0 críticas / 0 altas / 2 moderadas** (backend), 0 en frontend y 0 en la raíz. Esto confirma que S1 no es «una vez»: el CI (`audit` corta con altas/críticas) lo detecta en cada PR.
- `mongoose` 9.12 trae el driver `mongodb` 7.8, que **no conecta con servidores MongoDB 5.0** («Missing required sub-document 'driver'»): rompía todos los tests y rompería un clúster viejo. Se fijó `mongodb` en **7.5.0** con `overrides` en `backend/package.json`. Cuando el clúster y la base de tests (mongodb-memory-server) usen MongoDB ≥ 6, se puede quitar el override.

## Dependencias (08/11/2026)
- Backend: **moderadas restantes: `mercadopago` (SDK 2.x) → `uuid`**. Subir a `mercadopago@3.6` es un cambio mayor sobre el cobro; no se hizo sin probar contra Mercado Pago real. No son críticas ni altas.
- Se pasó a `zod` 4 y `nodemailer` 10 (cambios mayores) corrigiendo el código y con los 176 tests del backend en verde.
- `xlsx` (con vulnerabilidades altas sin parche en npm) se **reemplazó** por `read-excel-file` en la pantalla «Importar planilla». ⚠️ No se probó con la planilla real del taller (solo compila y el flujo de la pantalla); probar con el `.xlsx` verdadero antes de usarla.

## Cómo reportar una vulnerabilidad
Escribir al contacto de `security.txt` (el dueño lo completa al desplegar). Plazo de respuesta: **a definir por el dueño** (propuesta: 5 días hábiles). Pedimos no publicarlo antes de que haya parche.
