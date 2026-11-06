const COMMON = ['password', 'contrasena', 'qwerty', '123456', 'admin', 'letmein', 'welcome', 'printhub'];

/** Devuelve el motivo si la contraseña no sirve, o null. Admin/staff: ≥ 12 caracteres; clientes: ≥ 8. */
export const passwordProblem = (password: unknown, role = 'client'): string | null => {
  if (typeof password !== 'string') return 'Contraseña requerida';
  const min = role === 'admin' || role === 'staff' ? 12 : 8;
  if (password.length < min) return `La contraseña debe tener al menos ${min} caracteres`;
  if (password.length > 128) return 'La contraseña es demasiado larga (máx. 128)';
  if (/^(.)\1+$/.test(password)) return 'La contraseña no puede repetir un solo carácter';
  const plain = password.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
  if (COMMON.some((c) => plain === c || plain === c.repeat(Math.ceil(12 / c.length)).slice(0, plain.length))) return 'Esa contraseña es demasiado común';
  return null;
};
