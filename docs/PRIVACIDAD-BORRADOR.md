# Datos personales (S12) — borrador técnico para revisar con un abogado

> **No es asesoramiento legal.** Los textos de política de privacidad y términos tienen que redactarlos o revisarlos un profesional (Ley 25.326 de Protección de Datos Personales de Argentina). Esto lista lo que el software hace y guarda, para dárselo al profesional.

## Qué datos personales guarda PrintHub3D
| Dato | Dónde | Para qué |
|---|---|---|
| Nombre, contacto (teléfono/chat), notas del pedido | Pedidos, clientes, ventas | Producir y entregar el pedido, avisar por WhatsApp |
| Email y contraseña (con hash bcrypt) del personal y clientes con cuenta | Usuarios | Acceso |
| Operarios: nombre y PIN (hash bcrypt) | Operarios | Registrar quién hizo cada pieza |
| Fotos y modelos 3D subidos con el pedido | Archivos (GridFS) | Producir |
| Registro de auditoría: quién hizo qué (ids y nombres del personal) | Auditoría | Seguridad; **no se puede borrar desde la aplicación** |

## Lo que ya hace el software
- **Acceso y exportación**: `GET /api/clients/:id/export` (solo admin) devuelve en JSON el cliente, sus pedidos y ventas.
- **Supresión a pedido**: `DELETE /api/clients/:id/personal-data` (solo admin) borra nombre, contacto, notas, adjuntos y links del cliente y de sus pedidos/piezas/ventas y los reemplaza por «Cliente eliminado»; **conserva los importes** (el taller los necesita para su contabilidad). Probado en `backend/tests/privacy.test.ts` (también que no toca a otro taller y que el registro de auditoría no guarda el dato borrado).
- **Logs sin datos personales**: los emails salen enmascarados (`a***@mail.com`) y ya no se registra el nombre del cliente al crear un pedido.
- **Minimización**: el aviso de errores (`ALERT_WEBHOOK_URL`) manda solo método, ruta y mensaje.

## Lo que falta (👤 con un profesional)
1. Política de privacidad y términos y condiciones publicados en la tienda (enlaces en el pie y en el formulario de pedido).
2. Inscripción de la base de datos ante la AAIP si corresponde, y definir el plazo de conservación de pedidos.
3. Consentimiento explícito en el formulario público de pedidos y en el registro de clientes (hoy no hay casilla).
4. Quién responde a los pedidos de acceso/supresión y en qué plazo (la ley da plazos cortos).
5. Los datos viven en Atlas/Render/Vercel (servidores fuera del país): evaluarlo con el profesional.
