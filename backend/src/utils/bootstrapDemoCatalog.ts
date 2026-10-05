import { appConfig } from '../config';
import logger from '../config/logger';
import { applyDemoCatalog } from './demoCatalog';

/**
 * Carga el catalogo de demo (productos, impresoras y filamentos) al arrancar,
 * solo si SEED_DEMO_CATALOG=true. Pensado para una unica vez en produccion:
 * PISA las secciones de la web del tenant por defecto. Despues de que cargue,
 * quitar la variable de entorno: si no esta, esta funcion no hace nada.
 */
export const bootstrapDemoCatalog = async (): Promise<void> => {
  if (process.env.SEED_DEMO_CATALOG !== 'true') return;

  try {
    const r = await applyDemoCatalog(appConfig.defaultTenantId);
    logger.info(
      `bootstrapDemoCatalog: catalogo cargado en "${appConfig.defaultTenantId}" ` +
        `(productos ${r.productos.items}, impresoras ${r.impresoras.items}, filamentos ${r.filamentos.items})`
    );
  } catch (error) {
    logger.error({ err: error }, 'bootstrapDemoCatalog: error cargando el catalogo de demo');
  }
};
