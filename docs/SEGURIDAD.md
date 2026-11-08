# Seguridad de PrintHub3D — informe (S13) y política de reporte

Fecha: 08/11/2026. Revisión hecha leyendo el código nuevo de esta etapa con la guía de la skill `security-review` (modo «alta confianza»; sin agentes aparte) y las pruebas automáticas. **No es una auditoría externa ni un pentest.**

## Estado por punto del paquete S
| | Qué | Estado | Evidencia |
|---|---|---|---|
| S1 | `npm audit --omit=dev` en 0 críticas/altas | ✅ **backend 0 críticas / 0 altas / 2 moderadas; frontend 0/0/0** (antes: backend 1 crítica + 11 altas; frontend 1 crítica + 6 altas) | corrido el 08/11/2026; ver «Dependencias» |
| S2 | CSP en bloqueo | 🟡 **en bloqueo desde hoy, pero `script-src` sigue con `'unsafe-inline'`** (Next.js inyecta scripts en línea y las páginas son estáticas); sin `unsafe-eval` en producción. Revisado en navegador: 0 violaciones en tienda y panel | `frontend/next.config.ts`; pasar a nonces exige renderizar todo el sitio dinámico (cambia rendimiento y 3D): decisión del dueño |
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

## Dependencias (08/11/2026)
- Backend: **moderadas restantes: `mercadopago` (SDK 2.x) → `uuid`**. Subir a `mercadopago@3.6` es un cambio mayor sobre el cobro; no se hizo sin probar contra Mercado Pago real. No son críticas ni altas.
- Se pasó a `zod` 4 y `nodemailer` 10 (cambios mayores) corrigiendo el código y con los 149 tests del backend en verde.
- `xlsx` (con vulnerabilidades altas sin parche en npm) se **reemplazó** por `read-excel-file` en la pantalla «Importar planilla». ⚠️ No se probó con la planilla real del taller (solo compila y el flujo de la pantalla); probar con el `.xlsx` verdadero antes de usarla.

## Cómo reportar una vulnerabilidad
Escribir al contacto de `security.txt` (el dueño lo completa al desplegar). Plazo de respuesta: **a definir por el dueño** (propuesta: 5 días hábiles). Pedimos no publicarlo antes de que haya parche.
