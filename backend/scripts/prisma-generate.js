/**
 * Run `prisma generate` with env fallbacks so Render builds do not fail
 * when DIRECT_URL is unset. Prisma requires every env() in schema.prisma
 * to exist at generate time, even though generate does not connect to the DB.
 */
const { execSync } = require('child_process');

if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}
if (!process.env.DATABASE_URL && process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder';
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

execSync('npx prisma generate', { stdio: 'inherit', env: process.env });
