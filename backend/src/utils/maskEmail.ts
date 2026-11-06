/** Para logs: "ana.perez@mail.com" → "a***@mail.com". Los datos personales no van completos a los registros (Ley 25.326). */
export const maskEmail = (email: unknown): string => {
  const s = String(email ?? '');
  const at = s.indexOf('@');
  return at < 1 ? '***' : `${s[0]}***${s.slice(at)}`;
};
