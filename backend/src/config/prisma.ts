import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

let isConnected: boolean | null = null;

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    console.log('✅ Connected to PostgreSQL database successfully.');
    return true;
  } catch (error: any) {
    isConnected = false;
    console.warn('⚠️ PostgreSQL connection failed:', error?.message || error);
    console.warn('ℹ️ Running in resilient mode. Ensure PostgreSQL is running and DATABASE_URL is configured.');
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  if (isConnected === null) {
    return Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost:5432'));
  }
  return isConnected;
}
