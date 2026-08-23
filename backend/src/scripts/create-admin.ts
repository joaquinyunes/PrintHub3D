import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Crea (o actualiza la contraseña de) el usuario administrador.
 *
 * Uso:
 *   node dist/scripts/create-admin.js --email jefe@taller.com --password "MiClaveFuerte"
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node dist/scripts/create-admin.js
 *
 * Si no se pasa contraseña, se genera una aleatoria y se imprime una sola vez.
 */

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/global3d';
const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'global3d_hq';

const argOf = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
};

const run = async () => {
  const email = (argOf('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  let password = argOf('password') || process.env.ADMIN_PASSWORD || '';
  let generated = false;

  if (!email) {
    console.error('❌ Falta el email. Pasá --email <email> o ADMIN_EMAIL=<email>.');
    process.exit(1);
  }
  if (!password) {
    password = crypto.randomBytes(9).toString('base64url');
    generated = true;
  }
  if (password.length < 8) {
    console.error('❌ La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    const { default: User } = await import('../modules/auth/user.model');

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const existing = await User.findOne({ email });
    if (existing) {
      (existing as any).password = hashed;
      (existing as any).role = 'admin';
      (existing as any).verified = true;
      (existing as any).loginAttempts = 0;
      (existing as any).lockUntil = undefined;
      await existing.save();
      console.log(`✅ Admin actualizado: ${email}`);
    } else {
      await User.create({
        name: 'Administrador',
        email,
        password: hashed,
        role: 'admin',
        tenantId: TENANT_ID,
        verified: true,
      });
      console.log(`✅ Admin creado: ${email}`);
    }

    if (generated) {
      console.log('\n──────────────────────────────────────────────');
      console.log(`  Contraseña generada: ${password}`);
      console.log('  Guardala ahora: no se vuelve a mostrar.');
      console.log('──────────────────────────────────────────────\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

run();
