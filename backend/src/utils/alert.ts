import logger from '../config/logger';

/**
 * Aviso de errores 500 a un webhook (Discord, Slack, Telegram vía bot, Better Stack, n8n…), sin dependencias (V7).
 * Se activa con ALERT_WEBHOOK_URL. Manda solo método, ruta y mensaje (nunca el cuerpo del pedido ni datos personales)
 * y como mucho un aviso por minuto por ruta+mensaje, para no inundar el canal si algo falla en bucle.
 */
const lastSent = new Map<string, number>();
const WINDOW_MS = 60_000;

export const alertServerError = (info: { method: string; path: string; message: string }): void => {
  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  if (!url) return;
  const key = `${info.method} ${info.path} ${info.message}`.slice(0, 200);
  const now = Date.now();
  if (now - (lastSent.get(key) ?? 0) < WINDOW_MS) return;
  lastSent.set(key, now);
  if (lastSent.size > 200) lastSent.clear();
  const text = `PrintHub3D · error 500 · ${info.method} ${info.path}\n${info.message.slice(0, 300)}`;
  // `content` lo entiende Discord, `text` Slack; el resto de las herramientas leen el JSON completo.
  fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content: text, text, ...info }), signal: AbortSignal.timeout(5000) })
    .catch((e) => logger.warn(`No se pudo mandar el aviso de error: ${e instanceof Error ? e.message : e}`));
};

export const _resetAlertThrottle = () => lastSent.clear();
