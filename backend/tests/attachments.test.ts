import request from 'supertest';
import { createApp } from '../src/app';
import { detectModel, safeDisplayName } from '../src/utils/modelFile';
import { bearer, PNG_1X1 } from './helpers';

const app = createApp();
const UP = '/api/orders/attachments';

// --- archivos de prueba construidos a mano ---
const asciiStl = Buffer.from('solid cubo\n facet normal 0 0 1\n  outer loop\n   vertex 0 0 0\n   vertex 1 0 0\n   vertex 0 1 0\n  endloop\n endfacet\nendsolid cubo\n');
const binaryStl = (triangles: number, extra = 0) => {
  const b = Buffer.alloc(84 + triangles * 50 + extra);
  b.write('binary stl header', 0, 'latin1');
  b.writeUInt32LE(triangles, 80);
  return b;
};
// ZIP mínimo válido con las dos entradas de un 3MF (sin comprimir) para el test de contenido.
const crc32 = (buf: Buffer) => {
  let c, crc = 0xffffffff;
  for (const byte of buf) {
    c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
};
const zip = (entries: Record<string, string>) => {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(entries)) {
    const n = Buffer.from(name, 'latin1');
    const data = Buffer.from(content);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt32LE(crc32(data), 14);
    lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(n.length, 26);
    const local = Buffer.concat([lh, n, data]);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt32LE(crc32(data), 16);
    ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(n.length, 28); ch.writeUInt32LE(offset, 42);
    centrals.push(Buffer.concat([ch, n]));
    locals.push(local);
    offset += local.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(centrals.length, 8); end.writeUInt16LE(centrals.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
};
const threeMf = () => zip({ '[Content_Types].xml': '<Types/>'.repeat(10), '3D/3dmodel.model': '<model></model>'.repeat(10) });

describe('detectModel (contenido real, no extensión)', () => {
  it('acepta STL ASCII, STL binario y 3MF', () => {
    expect(detectModel(asciiStl)?.ext).toBe('stl');
    expect(detectModel(binaryStl(3))?.ext).toBe('stl');
    expect(detectModel(threeMf())?.ext).toBe('3mf');
  });
  it('rechaza lo que se disfraza', () => {
    expect(detectModel(binaryStl(3, 7))).toBeNull(); // tamaño no coincide con la cantidad de triángulos
    expect(detectModel(binaryStl(0))).toBeNull();
    expect(detectModel(Buffer.from('MZ\x90\x00'.padEnd(200, 'A'), 'latin1'))).toBeNull(); // ejecutable de Windows
    expect(detectModel(Buffer.from('<html><script>alert(1)</script></html>'))).toBeNull();
    expect(detectModel(Buffer.from('solid x\nsin triangulos\n'))).toBeNull(); // "solid" sin facets
    expect(detectModel(zip({ 'otra-cosa.txt': 'hola'.repeat(40) }))).toBeNull(); // zip común, no es 3MF
    expect(detectModel(threeMf().subarray(0, 120))).toBeNull(); // zip truncado
  });
  it('limpia el nombre mostrado', () => {
    expect(safeDisplayName('C:\\Users\\x\\..\\pieza<script>.stl', 'f')).toBe('piezascript.stl');
    expect(safeDisplayName('', 'f.stl')).toBe('f.stl');
  });
});

describe('POST /api/orders/attachments', () => {
  const asStaff = (buf: Buffer, filename: string, contentType?: string) =>
    request(app).post(UP).set('Authorization', bearer('staff')).attach('file', buf, contentType ? { filename, contentType } : filename);

  it('exige sesión de personal', async () => {
    expect((await request(app).post(UP).attach('file', PNG_1X1, 'a.png')).status).toBe(401);
    expect((await request(app).post(UP).set('Authorization', bearer('client')).attach('file', PNG_1X1, 'a.png')).status).toBe(403);
  });

  it('guarda una imagen y la sirve con su tipo real', async () => {
    const up = await asStaff(PNG_1X1, 'referencia.png');
    expect(up.status).toBe(201);
    expect(up.body).toMatchObject({ kind: 'image', name: 'referencia.png' });
    const get = await request(app).get(up.body.url);
    expect(get.headers['content-type']).toBe('image/png');
    expect(get.headers['x-content-type-options']).toBe('nosniff');
  });

  it('guarda STL y 3MF, y SIEMPRE los sirve como descarga binaria (nunca con su tipo ni inline)', async () => {
    for (const [buf, name] of [[asciiStl, 'cubo.stl'], [binaryStl(5), 'binario.stl'], [threeMf(), 'modelo.3mf']] as const) {
      const up = await asStaff(buf, name);
      expect(up.status).toBe(201);
      expect(up.body.kind).toBe('model');
      const get = await request(app).get(up.body.url);
      expect(get.status).toBe(200);
      expect(get.headers['content-type']).toBe('application/octet-stream');
      expect(get.headers['content-disposition']).toMatch(/^attachment; filename="/);
      expect(get.headers['x-content-type-options']).toBe('nosniff');
      expect(get.headers['content-security-policy']).toBe('sandbox');
    }
  });

  it('un .stl que en realidad es otra cosa se rechaza aunque diga ser model/stl', async () => {
    for (const [buf, name, ct] of [
      [Buffer.from('<script>alert(1)</script>'), 'malo.stl', 'model/stl'],
      [Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(120)]), 'virus.stl', 'application/octet-stream'],
      [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), 'dibujo.png', 'image/png'],
      [Buffer.alloc(300), 'vacio.3mf', 'model/3mf'],
    ] as const) {
      const res = await asStaff(buf, name, ct);
      expect(res.status).toBe(415);
    }
  });

  it('un .png con contenido de STL tampoco pasa como imagen: queda registrado como modelo, no como png', async () => {
    const up = await asStaff(asciiStl, 'engana.png', 'image/png');
    expect(up.status).toBe(201);
    expect(up.body.kind).toBe('model');
    expect(up.body.url).toMatch(/\.stl$/);
  });

  it('respeta el tope de tamaño', async () => {
    const big = Buffer.alloc(51 * 1024 * 1024, 1);
    const res = await asStaff(big, 'enorme.stl');
    expect(res.status).toBe(413);
  }, 60000);
});

describe('pedido con imágenes y link de referencia', () => {
  const order = { clientName: 'Cliente Ref', items: [{ productName: 'Pieza', quantity: 1, price: 100, isCustom: true }] };
  const post = (extra: object) => request(app).post('/api/orders').set('Authorization', bearer('staff')).send({ ...order, ...extra });

  it('guarda referenceUrl y archivos subidos', async () => {
    const res = await post({ referenceUrl: 'https://www.thingiverse.com/thing:123', files: [{ name: 'a.png', url: '/uploads/1-abc.png', kind: 'image' }] });
    expect(res.status).toBe(201);
    expect(res.body.referenceUrl).toBe('https://www.thingiverse.com/thing:123');
    expect(res.body.files[0]).toMatchObject({ url: '/uploads/1-abc.png', kind: 'image' });
  });

  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'ftp://x.com/a', 'no es un link'])('rechaza el link %s', async (bad) => {
    expect((await post({ referenceUrl: bad })).status).toBe(400);
    expect((await post({ chatLink: bad })).status).toBe(400);
    expect((await post({ files: [{ name: 'x', url: bad }] })).status).toBe(400);
  });
});
