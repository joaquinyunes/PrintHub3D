import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Crea el documento de Settings del tenant si todavía no existe.
 * Idempotente: si ya hay settings, no toca nada.
 */
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/global3d';
const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'global3d_hq';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const { default: Settings } = await import('../modules/settings/settings.model');

    const existing = await Settings.findOne({ tenantId: TENANT_ID });
    if (existing) {
      console.log(`ℹ️  Settings ya existen para "${TENANT_ID}". Nada que hacer.`);
      process.exit(0);
    }

    await Settings.create({ tenantId: TENANT_ID });
    console.log(`✅ Settings iniciales creadas para "${TENANT_ID}".`);
    console.log('   Editá el resto desde el panel: /admin/settings y /admin/home');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando settings:', error);
    process.exit(1);
  }
};

run();
