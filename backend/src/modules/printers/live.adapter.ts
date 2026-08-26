import axios from 'axios';
import logger from '../../config/logger';

/**
 * Estado en vivo de una impresora. Hoy soporta OctoPrint (API estable).
 * Moonraker (Klipper) y Bambu (MQTT) quedan como TODO — la estructura ya
 * contempla ambos, solo falta el fetch específico de cada uno.
 */

export interface LiveStatus {
  online: boolean;
  state: 'idle' | 'printing' | 'paused' | 'error' | 'offline';
  progress: number; // 0-100
  file?: string;
  timeLeftSeconds?: number;
  nozzleTemp?: number;
  bedTemp?: number;
}

const offline = (): LiveStatus => ({ online: false, state: 'offline', progress: 0 });

async function octoprint(url: string, apiKey: string): Promise<LiveStatus> {
  const base = url.replace(/\/$/, '');
  const headers = { 'X-Api-Key': apiKey };
  const [job, printer] = await Promise.all([
    axios.get(`${base}/api/job`, { headers, timeout: 5000 }),
    axios.get(`${base}/api/printer`, { headers, timeout: 5000 }).catch(() => null),
  ]);

  const j = job.data || {};
  const p: any = printer?.data || {};
  const flags = p.state?.flags || {};
  const state: LiveStatus['state'] = flags.printing
    ? 'printing'
    : flags.paused
      ? 'paused'
      : flags.error
        ? 'error'
        : 'idle';

  return {
    online: true,
    state,
    progress: Math.round(j.progress?.completion || 0),
    file: j.job?.file?.name || undefined,
    timeLeftSeconds: j.progress?.printTimeLeft || undefined,
    nozzleTemp: p.temperature?.tool0?.actual,
    bedTemp: p.temperature?.bed?.actual,
  };
}

export async function getLiveStatus(integration?: {
  type?: string;
  url?: string;
  apiKey?: string;
}): Promise<LiveStatus> {
  if (!integration || !integration.type || integration.type === 'none' || !integration.url) {
    return offline();
  }
  try {
    if (integration.type === 'octoprint') {
      return await octoprint(integration.url, integration.apiKey || '');
    }
    // TODO: moonraker (`/printer/objects/query`) y bambu (MQTT sobre TLS)
    logger.warn(`Integración de impresora "${integration.type}" todavía no implementada`);
    return offline();
  } catch (err) {
    logger.warn('Error consultando estado de impresora:', (err as Error).message);
    return offline();
  }
}
