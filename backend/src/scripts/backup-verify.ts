/**
 * Prueba de restauración (S10): copia TODAS las colecciones de la base origen a una base temporal
 * y verifica que cada colección quedó con los mismos documentos (cantidad + huella SHA-256 del contenido).
 * No usa mongodump (no siempre está instalado): sirve como chequeo de que el contenido se puede volcar y volver a cargar.
 * La copia de seguridad "de verdad" es mongodump (docker-compose.prod.yml) o los backups de Atlas; ver docs/BACKUP-Y-RESTAURACION.md.
 *
 *   MONGO_URI=mongodb://... npm run backup:verify
 */
import crypto from 'crypto';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('Falta MONGO_URI');
  process.exit(1);
}

const digest = (docs: unknown[]): string => {
  // Orden estable por _id: la huella no depende del orden de lectura.
  const lines = docs.map((d) => EJSON.stringify(d, { relaxed: false })).sort();
  return crypto.createHash('sha256').update(lines.join('\n')).digest('hex');
};

(async () => {
  const client = await new MongoClient(uri).connect();
  const srcName = client.db().databaseName;
  const tmpName = `${srcName}_restore_check_${Date.now()}`;
  const src = client.db(srcName);
  const tmp = client.db(tmpName);
  let failed = false;
  try {
    const cols = (await src.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name).filter((n) => !n.startsWith('system.'));
    for (const name of cols) {
      const docs = await src.collection(name).find({}).toArray();
      // "Volcado": serializar a EJSON (lo que viajaría en el archivo) y "restaurar": leerlo de nuevo.
      const dump = EJSON.stringify(docs, { relaxed: false });
      const restored = EJSON.parse(dump) as Record<string, unknown>[];
      if (restored.length) await tmp.collection(name).insertMany(restored as never[]);
      const back = await tmp.collection(name).find({}).toArray();
      const ok = back.length === docs.length && digest(back) === digest(docs);
      if (!ok) failed = true;
      console.log(`${ok ? 'OK   ' : 'FALLA'} ${name}: ${docs.length} documentos origen, ${back.length} restaurados`);
    }
    console.log(failed ? '\nRESTAURACIÓN: FALLÓ' : `\nRESTAURACIÓN: OK (${cols.length} colecciones, ${new Date().toISOString()})`);
  } finally {
    await tmp.dropDatabase();
    await client.close();
  }
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
