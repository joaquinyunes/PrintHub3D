/**
 * Valida el CONTENIDO de un archivo 3D (.stl / .3mf). La extensión y el MIME que declara el cliente no cuentan.
 * Estos archivos solo se guardan y se descargan: nunca se abren, descomprimen ni ejecutan en el servidor.
 */

export interface DetectedModel {
  kind: 'model';
  mime: 'model/stl' | 'model/3mf';
  ext: 'stl' | '3mf';
}

const hasNul = (buf: Buffer) => buf.indexOf(0) !== -1;

// STL binario: 80 bytes de cabecera + uint32 de triángulos + 50 bytes por triángulo, sin bytes de más.
const isBinaryStl = (buf: Buffer): boolean => {
  if (buf.length < 84) return false;
  const triangles = buf.readUInt32LE(80);
  return triangles > 0 && buf.length === 84 + triangles * 50;
};

// STL ASCII: texto puro "solid … facet normal … endsolid".
const isAsciiStl = (buf: Buffer): boolean => {
  if (hasNul(buf)) return false;
  const text = buf.toString('latin1');
  return /^\s*solid\b/i.test(text) && /\bfacet\s+normal\b/i.test(text) && /\bendsolid\b/i.test(text);
};

// 3MF = ZIP (OPC) con [Content_Types].xml y 3D/3dmodel.model; se exige también el fin de directorio central (zip completo).
const is3mf = (buf: Buffer): boolean => {
  if (buf.length < 100 || buf[0] !== 0x50 || buf[1] !== 0x4b || buf[2] !== 0x03 || buf[3] !== 0x04) return false;
  const tail = buf.subarray(Math.max(0, buf.length - 70_000));
  if (tail.indexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])) === -1) return false;
  return buf.includes('[Content_Types].xml', 0, 'latin1') && buf.includes('3D/3dmodel.model', 0, 'latin1');
};

export const detectModel = (buf: Buffer): DetectedModel | null => {
  if (is3mf(buf)) return { kind: 'model', mime: 'model/3mf', ext: '3mf' };
  if (isBinaryStl(buf) || isAsciiStl(buf)) return { kind: 'model', mime: 'model/stl', ext: 'stl' };
  return null;
};

/** Nombre original apto para mostrar: sin rutas ni caracteres de control, máx. 80. */
export const safeDisplayName = (raw: string, fallback: string): string => {
  const base = String(raw ?? '').split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex -- justamente se quitan los caracteres de control
  const clean = base.replace(/[\u0000-\u001f\u007f"<>:|?*]/g, '').trim().slice(0, 80);
  return clean || fallback;
};
