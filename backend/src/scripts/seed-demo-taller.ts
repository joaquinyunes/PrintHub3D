/**
 * Carga el taller de DEMOSTRACIÓN (V3). Solo corre con DEMO_MODE=true y contra una base con «demo» en el nombre.
 *
 *   DEMO_MODE=true MONGO_URI="mongodb+srv://…/printhub_demo" DEMO_ADMIN_PASSWORD="…12+ caracteres…" npm run seed:demo-taller
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { assertDemoDatabase, connectDemo, seedDemoTaller, DEMO_TENANT } from '../utils/demoTaller';

dotenv.config();

(async () => {
  try {
    assertDemoDatabase(process.env.MONGO_URI);
    const password = process.env.DEMO_ADMIN_PASSWORD;
    if (!password) throw new Error('Falta DEMO_ADMIN_PASSWORD (12+ caracteres).');
    await connectDemo(process.env.MONGO_URI as string);
    const r = await seedDemoTaller(password);
    console.log(`Taller de demo «${DEMO_TENANT}» cargado:`, r);
    console.log('Para entrar: admin@demo.example / personal@demo.example con la clave de DEMO_ADMIN_PASSWORD. Operarios (PIN): Lucía 4827, Marcos 5938.');
    await mongoose.disconnect();
  } catch (e) {
    console.error('No se cargó la demo:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
})();
