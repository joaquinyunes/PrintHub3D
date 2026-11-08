import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import User from '../src/modules/auth/user.model';
import Product from '../src/modules/products/product.model';
import AuditLog from '../src/modules/audit/audit.model';
import { hotp, newSecret, verifyTotp } from '../src/utils/totp';
import { passwordProblem } from '../src/utils/passwordPolicy';
import { maskEmail } from '../src/utils/maskEmail';
import { bearer } from './helpers';

const app = createApp();
const GOOD = 'Clave-Larga-De-Taller-9';

const mkUser = async (email: string, role: 'admin' | 'staff' | 'user' = 'admin', password = GOOD, tenantId = 'sec_a') =>
  User.create({ name: 'Persona ' + role, email, password: await bcrypt.hash(password, 4), role, tenantId, verified: true });
const login = (email: string, extra: object = {}, password = GOOD) => request(app).post('/api/auth/login').send({ email, password, ...extra });

describe('TOTP (RFC 6238)', () => {
  it('vectores de la RFC 6238 (SHA-1, secreto ASCII "12345678901234567890", 8 dígitos → últimos 6)', () => {
    // Base32 de "12345678901234567890"
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    expect(hotp(secret, Math.floor(59 / 30))).toBe('287082'); // RFC: 94287082
    expect(hotp(secret, Math.floor(1111111109 / 30))).toBe('081804'); // RFC: 07081804
    expect(hotp(secret, Math.floor(20000000000 / 30))).toBe('353130'); // RFC: 65353130
  });
  it('acepta el paso actual y ±1, rechaza el resto y lo que no sean 6 dígitos', () => {
    const s = newSecret();
    const now = 1_700_000_000_000;
    const step = Math.floor(now / 30_000);
    expect(verifyTotp(s, hotp(s, step), now)).toBe(true);
    expect(verifyTotp(s, hotp(s, step - 1), now)).toBe(true);
    expect(verifyTotp(s, hotp(s, step + 2), now)).toBe(false);
    expect(verifyTotp(s, '12345', now)).toBe(false);
    expect(verifyTotp(s, 'abcdef', now)).toBe(false);
  });
});

describe('política de contraseñas y datos personales en logs', () => {
  it.each([
    ['corta', 'Abc123456', 'admin', true], ['12 justas', 'Abcdefghij12', 'admin', false], ['común', 'password', 'client', true],
    ['repetida', 'aaaaaaaaaaaa', 'admin', true], ['cliente 8', 'abcd1234', 'client', false], ['cliente 7', 'abcd123', 'client', true],
  ])('%s', (_n, pw, role, bad) => {
    expect(passwordProblem(pw, role) !== null).toBe(bad);
  });
  it('maskEmail', () => {
    expect(maskEmail('ana.perez@mail.com')).toBe('a***@mail.com');
    expect(maskEmail(undefined)).toBe('***');
  });
});

describe('2FA en el login del panel', () => {
  it('activar 2FA exige un código válido; después el login pide el código y lo valida', async () => {
    const u: any = await mkUser('dos@fa.test');
    const token = (await login('dos@fa.test')).body.token as string;
    const setup = await request(app).post('/api/auth/2fa/setup').set('Authorization', `Bearer ${token}`);
    expect(setup.status).toBe(200);
    const secret = setup.body.secret as string;
    expect(setup.body.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);

    const mal = await request(app).post('/api/auth/2fa/enable').set('Authorization', `Bearer ${token}`).send({ code: '000000' });
    expect(mal.status).toBe(400);
    const step = Math.floor(Date.now() / 30_000);
    const ok = await request(app).post('/api/auth/2fa/enable').set('Authorization', `Bearer ${token}`).send({ code: hotp(secret, step) });
    expect(ok.status).toBe(200);

    expect((await login('dos@fa.test')).body.code).toBe('OTP_REQUIRED');
    expect((await login('dos@fa.test', { otp: '123456' })).body.code).toBe('OTP_INVALID');
    const good = await login('dos@fa.test', { otp: hotp(secret, Math.floor(Date.now() / 30_000)) });
    expect(good.status).toBe(200);
    expect(good.body.token).toBeTruthy();

    // el secreto jamás sale en las respuestas de usuario
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${good.body.token}`);
    expect(JSON.stringify(me.body)).not.toContain(secret);
    expect(u).toBeTruthy();
  });

  it('5 códigos incorrectos bloquean la cuenta 15 minutos', async () => {
    const u: any = await mkUser('lock@fa.test');
    await User.updateOne({ _id: u._id }, { $set: { totpEnabled: true, totpSecret: newSecret() } });
    for (let i = 0; i < 5; i++) await login('lock@fa.test', { otp: '111111' });
    const blocked = await login('lock@fa.test', { otp: '111111' });
    expect(blocked.status).toBe(403);
  });
});

describe('la 2FA no se esquiva por otros caminos de login', () => {
  it('con 2FA activa, el código por email (magic) no abre sesión; sin 2FA sigue funcionando', async () => {
    const withTotp: any = await mkUser('magic2fa@fa.test');
    await User.updateOne({ _id: withTotp._id }, { $set: { totpEnabled: true, totpSecret: newSecret(), magicCode: '123456', magicCodeExpires: new Date(Date.now() + 60_000) } });
    const blocked = await request(app).post('/api/auth/magic/verify').send({ identifier: 'magic2fa@fa.test', code: '123456' });
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('OTP_REQUIRED');
    expect(blocked.body.token).toBeUndefined();

    const plain: any = await mkUser('magicplain@fa.test');
    await User.updateOne({ _id: plain._id }, { $set: { magicCode: '654321', magicCodeExpires: new Date(Date.now() + 60_000) } });
    const ok = await request(app).post('/api/auth/magic/verify').send({ identifier: 'magicplain@fa.test', code: '654321' });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
  });
});

describe('cerrar sesión en todos los dispositivos', () => {
  it('después de logout-all, los tokens anteriores dejan de valer', async () => {
    await mkUser('multi@dev.test');
    const a = (await login('multi@dev.test')).body.token as string;
    const b = (await login('multi@dev.test')).body.token as string;
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${a}`)).status).toBe(200);
    expect((await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${a}`)).status).toBe(200);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${a}`)).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${b}`)).status).toBe(401);
    expect((await login('multi@dev.test')).body.token).toBeTruthy(); // se puede volver a entrar
  });
});

describe('contraseñas por rol al dar de alta usuarios del panel', () => {
  it('admin/staff necesitan ≥ 12 caracteres', async () => {
    const weak = await request(app).post('/api/users').set('Authorization', bearer('admin', 'sec_a')).send({ name: 'Ope', email: 'ope@t.test', role: 'staff', password: 'Corta123' });
    expect(weak.status).toBe(400);
    const ok = await request(app).post('/api/users').set('Authorization', bearer('admin', 'sec_a')).send({ name: 'Ope', email: 'ope@t.test', role: 'staff', password: GOOD });
    expect(ok.status).toBe(201);
  });
});

describe('auditoría de precio/stock y encabezados', () => {
  it('cambiar el precio de un producto queda registrado con valor anterior y nuevo', async () => {
    const p: any = await Product.create({ name: 'Taza', price: 100, cost: 10, stock: 5, tenantId: 'sec_a' });
    const res = await request(app).put(`/api/products/${p._id}`).set('Authorization', bearer('admin', 'sec_a')).send({ name: 'Taza', price: 150 });
    expect(res.status).toBe(200);
    const log: any = await AuditLog.findOne({ tenantId: 'sec_a', action: 'product.update', target: String(p._id) }).lean();
    expect(log.detail.price).toEqual({ from: 100, to: 150 });
    const list = await request(app).get('/api/audit').set('Authorization', bearer('admin', 'sec_a'));
    expect(list.status).toBe(200);
    expect(list.body.items.length).toBeGreaterThan(0);
    expect((await request(app).get('/api/audit').set('Authorization', bearer('staff', 'sec_a'))).status).toBe(403);
    expect((await request(app).delete('/api/audit').set('Authorization', bearer('admin', 'sec_a'))).status).toBe(404); // no hay forma de borrar
  });

  it('la API manda los encabezados de seguridad', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toMatch(/max-age=63072000/);
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['permissions-policy']).toMatch(/camera=\(\)/);
  });

  it('CORS: un origen ajeno no recibe Access-Control-Allow-Origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://sitio-malo.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
