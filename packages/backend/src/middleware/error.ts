import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../utils/logger.js';

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): void {
  logger.error('Request error', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
  });

  const statusCode = error.statusCode ?? 500;
  const response: ApiError = {
    statusCode,
    error: error.name || 'Internal Server Error',
    message: statusCode === 500 ? 'An unexpected error occurred' : error.message,
  };

  reply.status(statusCode).send(response);
}
