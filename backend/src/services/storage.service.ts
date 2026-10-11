import crypto from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import type { GridFSBucket, GridFSFile, ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import { detectFileType, DetectedFile, FileKind, SIGNATURE_BYTES } from '../utils/fileSignature';

/**
 * Almacenamiento persistente de archivos subidos (GridFS sobre la misma MongoDB).
 *
 * El disco del hosting (Render) es efímero: todo lo que se escribía en
 * `backend/uploads/` desaparecía en cada deploy. GridFS vive en la base de
 * datos, así que sobrevive a deploys y reinicios sin sumar otro servicio.
 */

const BUCKET_NAME = 'uploads';

let bucket: GridFSBucket | null = null;

export const getBucket = (): GridFSBucket => {
  const db = mongoose.connection.db;
  if (!db) throw new AppError('Base de datos no disponible', 503);
  if (!bucket || (bucket as any).s?.db !== db) {
    bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: BUCKET_NAME });
  }
  return bucket;
};

export interface StoredFile {
  id: ObjectId;
  filename: string;
  mimetype: string;
  size: number;
}

export interface StoreOptions {
  allowedKinds: FileKind[];
  tenantId?: string;
}

/**
 * Lee la cabecera del stream, valida el tipo real del archivo y lo guarda en
 * GridFS sin cargarlo entero en memoria. Lanza AppError(415) si no es un tipo permitido.
 */
export const storeStream = async (source: Readable, opts: StoreOptions): Promise<StoredFile> => {
  const iterator = source[Symbol.asyncIterator]() as AsyncIterator<Buffer>;

  let head: Buffer = Buffer.alloc(0);
  let ended = false;
  while (head.length < SIGNATURE_BYTES && !ended) {
    const next = await iterator.next();
    if (next.done) ended = true;
    else head = Buffer.concat([head, next.value]);
  }

  const detected: DetectedFile | null = detectFileType(head);
  if (!detected || !opts.allowedKinds.includes(detected.kind)) {
    const allowed = opts.allowedKinds.map((k) => (k === 'image' ? 'imágenes' : 'videos')).join(' y ');
    throw new AppError(`Tipo de archivo no permitido. Solo ${allowed}.`, 415);
  }

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${detected.ext}`;
  const upload = getBucket().openUploadStream(filename, {
    // mongodb 7 ya no tiene `contentType` de primer nivel en GridFS: va en metadata.
    metadata: { contentType: detected.mime, kind: detected.kind, tenantId: opts.tenantId },
  });

  const chunks = (async function* () {
    yield head;
    while (!ended) {
      const next = await iterator.next();
      if (next.done) return;
      yield next.value;
    }
  })();

  await pipeline(Readable.from(chunks), upload);

  return { id: upload.id as ObjectId, filename, mimetype: detected.mime, size: upload.length };
};

export const findStoredFile = async (filename: string): Promise<GridFSFile | null> => {
  const files = await getBucket()
    .find({ filename })
    .sort({ uploadDate: -1 })
    .limit(1)
    .toArray();
  return files[0] ?? null;
};

export const openDownload = (id: ObjectId, range?: { start: number; end: number }) =>
  getBucket().openDownloadStream(id, range ? { start: range.start, end: range.end + 1 } : undefined);

export const deleteStoredFile = async (id: ObjectId | string): Promise<void> => {
  const objectId = typeof id === 'string' ? new mongoose.mongo.ObjectId(id) : id;
  await getBucket().delete(objectId);
};
