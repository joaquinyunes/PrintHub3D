/**
 * Igual que en el frontend: empareja código de pedido con filas de "Videos por código".
 */
export function stripCodeForMatch(input: string): string {
  return String(input || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '');
}

export function findCustomVideoUrl(
  trackingOrSearchCode: string,
  customCodes: Array<{ code?: string; videoUrl?: string }> | undefined | null,
): string | null {
  const needle = stripCodeForMatch(trackingOrSearchCode);
  if (!needle || !customCodes?.length) return null;

  const withVideo = customCodes.filter((c) => c?.videoUrl && String(c.videoUrl).trim());
  if (!withVideo.length) return null;

  let best: { len: number; url: string } | null = null;

  for (const cc of withVideo) {
    const key = stripCodeForMatch(String(cc.code || ''));
    if (!key) continue;
    if (needle.includes(key) || key.includes(needle)) {
      const len = key.length;
      if (!best || len > best.len) best = { len, url: String(cc.videoUrl) };
    }
  }

  return best?.url ?? null;
}
