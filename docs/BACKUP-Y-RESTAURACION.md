# Backups y prueba de restauración (S10)

**Sin una restauración probada no se vende.** Estado al 08/11/2026: hay backups configurados, la **restauración con `mongodump` real NO está probada** (esta máquina no tiene Docker ni las herramientas de MongoDB); sí está probado un chequeo lógico de ida y vuelta.

## Qué backup hay
| Dónde corre | Cómo | Retención |
|---|---|---|
| Docker (`docker-compose.prod.yml`) | servicio `mongo-backup`: `mongodump` diario a `./backups` | 14 días |
| MongoDB Atlas (recomendado para clientes) | Cloud Backup en clusters dedicados (M10+); el plan Flex tiene su propia política | según plan: **revisar en la consola de Atlas** |

Los archivos subidos (fotos, .stl, .3mf) viven en la misma base (GridFS), así que están dentro del backup.

## Prueba hecha (lógica, 08/11/2026)
`npm run backup:verify` (en `backend/`, con `MONGO_URI`): vuelca cada colección a EJSON, la restaura en una base temporal y compara cantidad y huella SHA-256 documento por documento; borra la base temporal al final.
- Resultado 08/11/2026 sobre una base local de prueba: **22 colecciones, todas OK** (ej.: `users` 2→2, `pieces` 2→2, `auditlogs` 2→2, `orders` 1→1).
- Alcance: prueba que el contenido se puede volcar y volver a cargar sin pérdidas. **No** prueba el archivo de `mongodump` ni la restauración en el servidor del cliente.

## Prueba real que falta (👤 o quien tenga Docker/Atlas) — 15 minutos
1. Backup: `docker compose -f docker-compose.prod.yml exec mongo-backup ls /backups` (debe haber un archivo de hoy) — o, en Atlas, un snapshot reciente.
2. Restaurar en una base **de prueba**, nunca sobre producción:
   ```bash
   docker compose -f docker-compose.prod.yml exec -T mongodb \
     mongorestore --uri="mongodb://localhost:27017" --nsFrom="global3d.*" --nsTo="global3d_restore.*" --gzip --archive < backups/global3d-XXXX.archive.gz
   ```
3. Apuntar un backend de prueba a `global3d_restore` y entrar: deben estar los pedidos, las piezas y las imágenes del pedido.
4. Anotar acá fecha, quién lo hizo y resultado:

| Fecha | Quién | Origen | Resultado |
|---|---|---|---|
| 08/11/2026 | Claude (lógica, `backup:verify`) | base local de prueba | 22/22 colecciones OK |
| _pendiente_ | | `mongodump` real / snapshot de Atlas | |

Repetir **cada trimestre** (está en el paquete Mensual).
