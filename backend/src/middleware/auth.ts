import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'global3d-secret-key-2024';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'staff' | 'reseller';
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function protect(roles: string[] = ['admin']) {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !roles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    req.user = decoded;
    next();
  };
}

export default { generateToken, verifyToken, protect };