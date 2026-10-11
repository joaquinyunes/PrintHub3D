import { NextFunction, Request, Response, Router } from 'express';
import { findStoredFile, openDownload } from '../services/storage.service';
import logger from '../config/logger';

/**
 * GET /uploads/:filename — sirve los archivos guardados en GridFS.
 * Los nombres son únicos (timestamp + aleatorio), así que se pueden cachear "para siempre".
 */
const router = Router();

const parseRange = (header: string | undefined, size: number): { start: number; end: number } | null => {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header || '');
  if (!m || (m[1] === '' && m[2] === '')) return null;
  let start: number;
  let end: number;
  if (m[1] === '') {
    // Sufijo: los últimos N bytes
    start = Math.max(0, size - Number(m[2]));
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start > end || start >= size) return null;
  return { start, end };
};

router.get('/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filename = String(req.params.filename);
    const file = await findStoredFile(filename);
    if (!file) return next();

    const size = file.length;
    const contentType = (file.metadata?.contentType as string | undefined) || 'application/octet-stream';

    res.set({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      ETag: `"${file._id.toString()}"`,
    });

    if (req.headers['if-none-match'] === `"${file._id.toString()}"`) {
      res.status(304).end();
      return;
    }

    const rangeHeader = req.headers.range;
    const range = parseRange(rangeHeader, size);

    if (rangeHeader && !range) {
      res.status(416).set('Content-Range', `bytes */${size}`).end();
      return;
    }

    if (range) {
      res.status(206).set({
        'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
        'Content-Length': String(range.end - range.start + 1),
      });
    } else {
      res.set('Content-Length', String(size));
    }

    const stream = openDownload(file._id, range ?? undefined);
    stream.on('error', (err) => {
      logger.error({ msg: 'Error leyendo archivo de GridFS', filename, err: err.message });
      if (!res.headersSent) res.status(500).end();
      else res.destroy();
    });
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
