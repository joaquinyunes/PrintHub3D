import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { applyDemoCatalog } from '../utils/demoCatalog';

dotenv.config();

/**
 * Carga un catalogo de DEMO completo (textos + imagenes) para mostrar el
 * sistema funcionando. Pensado para demos comerciales, no para datos reales.
 *
 *   npm run seed:demo
 *
 * OJO: PISA las secciones de la web (productos, impresoras, filamentos,
 * rastreo y la home). Los pedidos, ventas, gastos y usuarios NO se tocan.
 * Los datos viven en src/utils/demoCatalog.ts.
 */

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/global3d';
const TENANT_ID = process.env.DEFAULT_TENANT_ID || 'global3d_hq';

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const r = await applyDemoCatalog(TENANT_ID);

    console.log(`Catalogo de demo cargado en "${TENANT_ID}".`);
    console.log(`  Productos:  ${r.productos.categorias} categorias, ${r.productos.items} items`);
    console.log(`  Impresoras: ${r.impresoras.categorias} categorias, ${r.impresoras.items} items`);
    console.log(`  Filamentos: ${r.filamentos.categorias} categorias, ${r.filamentos.items} items`);
    console.log('Las imagenes salen de frontend/public/demo/*.svg');
    process.exit(0);
  } catch (error) {
    console.error('Error cargando el catalogo de demo:', error);
    process.exit(1);
  }
};

run();
