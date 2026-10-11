import request from 'supertest';
import { createApp } from '../src/app';
import { bearer, PNG_1X1 } from './helpers';

const app = createApp();
const UPLOAD = '/api/settings/upload-image';

describe('Subida de imágenes (GridFS)', () => {
  it('exige autenticación', async () => {
    const res = await request(app).post(UPLOAD).attach('image', PNG_1X1, 'a.png');
    expect(res.status).toBe(401);
  });

  it('solo el admin puede subir imágenes de la home', async () => {
    const res = await request(app)
      .post(UPLOAD)
      .set('Authorization', bearer('staff'))
      .attach('image', PNG_1X1, 'a.png');
    expect(res.status).toBe(403);
  });

  it('guarda la imagen y la sirve de vuelta con el tipo correcto', async () => {
    const up = await request(app)
      .post(UPLOAD)
      .set('Authorization', bearer('admin'))
      .attach('image', PNG_1X1, 'mi foto.png');

    expect(up.status).toBe(200);
    expect(up.body.imageUrl).toMatch(/^\/uploads\/\d+-[0-9a-f]{16}\.png$/);

    const get = await request(app).get(up.body.imageUrl).buffer(true).parse((r, cb) => {
      const chunks: Buffer[] = [];
      r.on('data', (c: Buffer) => chunks.push(c));
      r.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(get.status).toBe(200);
    expect(get.headers['content-type']).toBe('image/png');
    expect(get.headers['x-content-type-options']).toBe('nosniff');
    expect(Buffer.compare(get.body, PNG_1X1)).toBe(0);
  });

  it('ignora el MIME y la extensión del cliente: valida por contenido', async () => {
    const res = await request(app)
      .post(UPLOAD)
      .set('Authorization', bearer('admin'))
      .attach('image', Buffer.from('<script>alert(1)</script>'), { filename: 'inocente.png', contentType: 'image/png' });

    expect(res.status).toBe(415);
  });

  it('soporta pedidos parciales (Range) para video/imágenes grandes', async () => {
    const up = await request(app)
      .post(UPLOAD)
      .set('Authorization', bearer('admin'))
      .attach('image', PNG_1X1, 'a.png');

    const part = await request(app).get(up.body.imageUrl).set('Range', 'bytes=0-7');
    expect(part.status).toBe(206);
    expect(part.headers['content-range']).toBe(`bytes 0-7/${PNG_1X1.length}`);
  });

  it('devuelve 404 para archivos inexistentes', async () => {
    const res = await request(app).get('/uploads/no-existe.png');
    expect(res.status).toBe(404);
  });

  it('acepta video mp4 en la home y lo sirve como video/mp4', async () => {
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 0x18]), Buffer.from('ftypisom', 'latin1'), Buffer.alloc(32)]);
    const up = await request(app).post(UPLOAD).set('Authorization', bearer('admin')).attach('image', mp4, 'v.mp4');
    expect(up.status).toBe(200);
    expect(up.body.imageUrl).toMatch(/\.mp4$/);

    const get = await request(app).get(up.body.imageUrl);
    expect(get.headers['content-type']).toBe('video/mp4');
  });

  it('rechaza ejecutables aunque se llamen .jpg', async () => {
    const exe = Buffer.concat([Buffer.from([0x4d, 0x5a, 0x90, 0x00]), Buffer.alloc(64)]);
    const res = await request(app).post(UPLOAD).set('Authorization', bearer('admin')).attach('image', exe, 'foto.jpg');
    expect(res.status).toBe(415);
  });
});
