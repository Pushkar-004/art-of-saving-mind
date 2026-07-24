import { PrismaClient } from '@prisma/client';
import { env } from '@/config/env';

// Prevents multiple PrismaClient instances during ts-node-dev hot reloads
// in development (each reload would otherwise open a new connection pool).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: env.isProduction ? ['error', 'warn'] : ['query', 'error', 'warn'],
  });

if (!env.isProduction) {
  global.__prisma = prisma;
}
