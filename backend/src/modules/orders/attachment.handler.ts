import { NextFunction, Request, RequestHandler, Response } from 'express';
import multer from 'multer';
import { detectFileType } from '../../utils/fileSignature';
import { detectModel, safeDisplayName } from '../../utils/modelFile';
import { storeBuffer } from '../../services/storage.service';
import { AppError } from '../../utils/AppError';
import { audit } from '../audit/audit.service';

export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024; // un .3mf con texturas puede pasar los 20 MB

// En memoria (con tope de tamaño) porque el contenido se valida entero antes de guardarlo.
const uploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_ATTACHMENT_BYTES, files: 1 } }).single('file');

export const receiveAttachment: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  uploader(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      return next(err.code === 'LIMIT_FILE_SIZE' ? new AppError('El archivo supera los 50 MB.', 413) : new AppError('No se pudo procesar el archivo.', 400));
    }
    next(err);
  });
};

/** Imagen (por magic bytes) o modelo 3D (.stl/.3mf por contenido). Todo lo demás: 415. */
export const saveAttachment = async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'Falta el archivo (campo "file").' });

  const img = detectFileType(file.buffer.subarray(0, 16));
  const model = img ? null : detectModel(file.buffer);
  if ((!img || img.kind !== 'image') && !model) {
    return res.status(415).json({ message: 'Tipo de archivo no permitido. Solo imágenes (JPG, PNG, GIF, WEBP, AVIF) y modelos 3D (.stl, .3mf) válidos.' });
  }

  const found = model ?? img!;
  const kind = model ? 'model' : 'image';
  const name = safeDisplayName(file.originalname, `archivo.${found.ext}`);
  const stored = await storeBuffer(file.buffer, { mime: found.mime, ext: found.ext, kind, tenantId: req.tenantId, originalName: name });
  await audit(req, 'order.attachment', stored.filename, { kind, size: stored.size });
  res.status(201).json({ name, url: `/uploads/${stored.filename}`, kind });
};
