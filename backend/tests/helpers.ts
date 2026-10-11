import jwt from 'jsonwebtoken';

export type TestRole = 'admin' | 'staff' | 'client';

/** Token firmado como lo hace el login real (mismo secreto que tests/env.ts). */
export const tokenFor = (role: TestRole, tenantId = 'tenant_a', id = '64b000000000000000000001'): string =>
  jwt.sign({ id, role, tenantId }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

export const bearer = (role: TestRole, tenantId?: string): string => `Bearer ${tokenFor(role, tenantId)}`;

/** Cabeceras mínimas de un archivo real para los tests de subida. */
export const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
