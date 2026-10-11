/**
 * Detecta el tipo real de un archivo por sus primeros bytes ("magic numbers").
 * El MIME y la extensión que declara el cliente son falsificables; esto no.
 */

export type FileKind = 'image' | 'video';

export interface DetectedFile {
  kind: FileKind;
  mime: string;
  ext: string;
}

/** Bytes mínimos que hay que leer para poder identificar cualquiera de los formatos. */
export const SIGNATURE_BYTES = 16;

const startsWith = (buf: Buffer, bytes: number[], offset = 0): boolean =>
  buf.length >= offset + bytes.length && bytes.every((b, i) => buf[offset + i] === b);

const ascii = (buf: Buffer, start: number, end: number): string =>
  buf.toString('latin1', start, end);

export const detectFileType = (buf: Buffer): DetectedFile | null => {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' };
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { kind: 'image', mime: 'image/png', ext: 'png' };
  }
  const head6 = ascii(buf, 0, 6);
  if (head6 === 'GIF87a' || head6 === 'GIF89a') return { kind: 'image', mime: 'image/gif', ext: 'gif' };
  if (ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 12) === 'WEBP') {
    return { kind: 'image', mime: 'image/webp', ext: 'webp' };
  }
  if (startsWith(buf, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: 'video', mime: 'video/webm', ext: 'webm' };

  // Contenedores ISO-BMFF (mp4 / mov / avif): "ftyp" en el offset 4 + marca de 4 bytes.
  if (ascii(buf, 4, 8) === 'ftyp') {
    const brand = ascii(buf, 8, 12);
    if (brand === 'avif' || brand === 'avis') return { kind: 'image', mime: 'image/avif', ext: 'avif' };
    if (brand === 'qt  ') return { kind: 'video', mime: 'video/quicktime', ext: 'mov' };
    return { kind: 'video', mime: 'video/mp4', ext: 'mp4' };
  }

  return null;
};
