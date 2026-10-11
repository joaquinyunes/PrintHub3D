import { NextFunction, Request, RequestHandler, Response } from 'express';
import multer, { StorageEngine } from 'multer';
import { AppError } from '../utils/AppError';
import { FileKind } from '../utils/fileSignature';
import { deleteStoredFile, storeStream } from '../services/storage.service';

/**
 * Subidas de archivos: valida el tipo real por magic bytes (no por el MIME del
 * cliente), pone nombre propio al archivo y lo guarda en GridFS.
 *
 * Deja en `req.file`: `filename` (sirve como `/uploads/<filename>`), `mimetype`
 * y `size` ya con los valores verificados.
 */

class GridFsStorage implements StorageEngine {
  constructor(private readonly allowedKinds: FileKind[]) {}

  _handleFile(
    req: Request,
    file: Express.Multer.File,
    cb: (error?: any, info?: Partial<Express.Multer.File>) => void,
  ): void {
    storeStream(file.stream, {
      allowedKinds: this.allowedKinds,
      tenantId: req.user?.tenantId,
    })
      .then((stored) =>
        cb(null, {
          filename: stored.filename,
          mimetype: stored.mimetype,
          size: stored.size,
          // Lo usa _removeFile si multer aborta la subida (p. ej. límite de tamaño).
          path: String(stored.id),
        }),
      )
      .catch((err) => {
        // Hay que consumir el resto del stream para que multer pueda terminar de parsear.
        file.stream.resume();
        cb(err);
      });
  }

  _removeFile(_req: Request, file: Express.Multer.File, cb: (error: Error | null) => void): void {
    if (!file.path) return cb(null);
    deleteStoredFile(file.path)
      .then(() => cb(null))
      .catch(() => cb(null));
  }
}

export interface UploadOptions {
  /** Nombre del campo multipart. */
  field: string;
  allowedKinds: FileKind[];
  maxBytes: number;
}

const toAppError = (err: unknown): unknown => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return new AppError('El archivo supera el tamaño máximo permitido.', 413);
    if (err.code === 'LIMIT_UNEXPECTED_FILE') return new AppError('Campo de archivo inesperado.', 400);
    return new AppError('No se pudo procesar el archivo.', 400);
  }
  return err;
};

/** Middleware que recibe UN archivo y deja el resultado en `req.file`. */
export const singleUpload = ({ field, allowedKinds, maxBytes }: UploadOptions): RequestHandler => {
  const uploader = multer({
    storage: new GridFsStorage(allowedKinds),
    limits: { fileSize: maxBytes, files: 1 },
  }).single(field);

  return (req: Request, res: Response, next: NextFunction) => {
    uploader(req, res, (err: unknown) => (err ? next(toAppError(err)) : next()));
  };
};

export const MB = 1024 * 1024;
