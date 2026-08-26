import { appConfig } from '../../config';
import logger from '../../config/logger';

/**
 * Integración con AFIP (facturación electrónica WSFEv1).
 *
 * ESTADO: estructura lista, falta la integración real con el web service de AFIP.
 * Para completarla se necesita del taller: CUIT, certificado (.crt) y clave
 * privada (.key) generados en el portal de AFIP, y el punto de venta habilitado.
 *
 * Implementación sugerida: usar `@afipsdk/afip.js` (maneja WSAA + TA + firma CMS)
 * o el web service directo. El flujo es:
 *   1. Obtener/renovar el Ticket de Acceso (TA) — cachearlo ~12 h.
 *   2. FECompUltimoAutorizado(ptoVta, cbteTipo) → último número.
 *   3. FECAESolicitar con el comprobante (neto, IVA, total, doc del cliente).
 *   4. Guardar CAE + vencimiento en la colección Invoice y generar el PDF.
 */

export interface InvoiceRequest {
  type: 'A' | 'B' | 'C';
  total: number;
  customerDoc: string; // CUIT o DNI; '' = consumidor final
  customerName: string;
  concept?: 'productos' | 'servicios' | 'ambos';
}

export interface InvoiceResult {
  type: string;
  pointOfSale: number;
  number: number;
  cae: string;
  caeExpires: Date;
  net: number;
  vat: number;
  total: number;
}

export const isAfipConfigured = (): boolean =>
  Boolean(appConfig.afip.cuit && appConfig.afip.cert && appConfig.afip.key);

export const AfipService = {
  configured: isAfipConfigured,

  async emitInvoice(_req: InvoiceRequest): Promise<InvoiceResult> {
    if (!isAfipConfigured()) {
      const err: any = new Error('AFIP no configurado (AFIP_CUIT / AFIP_CERT / AFIP_KEY)');
      err.code = 'AFIP_NOT_CONFIGURED';
      throw err;
    }
    // TODO: integrar WSFEv1 (ver comentario arriba).
    logger.warn('AfipService.emitInvoice: integración WSFEv1 pendiente de implementar');
    const err: any = new Error('La emisión con AFIP todavía no está implementada');
    err.code = 'AFIP_NOT_IMPLEMENTED';
    throw err;
  },
};
