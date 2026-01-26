import { FastifyInstance } from 'fastify';
import { config } from '../config/index.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateTokens(
  fastify: FastifyInstance,
  payload: JwtPayload
): TokenPair {
  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: config.JWT_EXPIRES_IN,
  });

  const refreshToken = fastify.jwt.sign(payload, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
}

export async function verifyAccessToken(
  fastify: FastifyInstance,
  token: string
): Promise<JwtPayload | null> {
  try {
    const decoded = await fastify.jwt.verify<JwtPayload>(token);
    return decoded;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  fastify: FastifyInstance,
  token: string
): Promise<JwtPayload | null> {
  try {
    const decoded = await fastify.jwt.verify<JwtPayload>(token);
    return decoded;
  } catch {
    return null;
  }
}
