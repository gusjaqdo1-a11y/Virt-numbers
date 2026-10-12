import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured in production');
}
const secret = new TextEncoder().encode(rawSecret || 'development-only-secret-change-me');

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(id: string) {
  return new SignJWT({ sub: id, type: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function readSession(token?: string) {
  if (!token) return null;
  try {
    const payload = await jwtVerify(token, secret);
    return payload.type === 'user' ? payload.sub || null : null;
  } catch {
    return null;
  }
}

export async function signAdminSession(email: string) {
  return new SignJWT({ sub: email, type: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

export async function readAdminSession(token?: string) {
  if (!token) return null;
  try {
    const payload = await jwtVerify(token, secret);
    if (payload.type !== 'admin' || typeof payload.sub !== 'string') return null;
    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    return configuredEmail && payload.sub.toLowerCase() === configuredEmail ? payload.sub : null;
  } catch {
    return null;
  }
}
