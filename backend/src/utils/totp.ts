import crypto from 'crypto';

/** TOTP (RFC 6238): SHA-1, 6 dígitos, paso de 30 s. Compatible con Google Authenticator, Authy, 1Password. */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export const newSecret = (): string => {
  const bytes = crypto.randomBytes(20);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  return (bits.match(/.{1,5}/g) ?? []).map((c) => B32[parseInt(c.padEnd(5, '0'), 2)]).join('');
};

const decode = (secret: string): Buffer => {
  let bits = '';
  for (const ch of secret.replace(/=+$/, '').toUpperCase()) {
    const v = B32.indexOf(ch);
    if (v < 0) throw new Error('secreto inválido');
    bits += v.toString(2).padStart(5, '0');
  }
  return Buffer.from((bits.match(/.{8}/g) ?? []).map((b) => parseInt(b, 2)));
};

export const hotp = (secret: string, counter: number): string => {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = crypto.createHmac('sha1', decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 0xf;
  const code = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(code % 1_000_000).padStart(6, '0');
};

/** Acepta el código actual y ±1 paso (desfase de reloj). Comparación en tiempo constante. */
export const verifyTotp = (secret: string, code: string, now = Date.now()): boolean => {
  if (!/^\d{6}$/.test(code)) return false;
  const step = Math.floor(now / 30_000);
  let ok = false;
  for (const d of [-1, 0, 1]) {
    if (crypto.timingSafeEqual(Buffer.from(hotp(secret, step + d)), Buffer.from(code))) ok = true;
  }
  return ok;
};

export const otpauthUri = (secret: string, account: string, issuer = 'PrintHub3D'): string =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
