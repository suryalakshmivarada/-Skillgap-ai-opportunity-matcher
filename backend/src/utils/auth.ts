import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Returns the configured JWT secret key or throws a clear configuration error if missing or too short.
 * Requires at least 32 characters without fallback defaults.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      'JWT_SECRET configuration error: process.env.JWT_SECRET must be defined and contain at least 32 characters.'
    );
  }
  return secret.trim();
}

export interface AuthTokenPayload {
  id: string;
  email: string;
}

/**
 * Generates a signed JWT authentication token (7-day validity) using HS256.
 */
export function generateToken(payload: AuthTokenPayload): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '7d'
  });
}

/**
 * Verifies a JWT authentication token using HS256 and returns its decoded payload.
 * Returns null if token is invalid or expired.
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    }) as AuthTokenPayload;
    if (decoded && decoded.id && decoded.email) {
      return { id: decoded.id, email: decoded.email };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hashes a plaintext password using bcrypt with salt factor 10.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
