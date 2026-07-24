import dotenv from 'dotenv';

dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value : fallback;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5001'), 10),
  CORS_ORIGIN: optional('CORS_ORIGIN', 'http://localhost:3000'),

  DATABASE_URL: required('DATABASE_URL'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '7d'),

  PASSWORD_RESET_TOKEN_EXPIRES_MINUTES: parseInt(
    optional('PASSWORD_RESET_TOKEN_EXPIRES_MINUTES', '30'),
    10,
  ),
  FRONTEND_URL: optional('FRONTEND_URL', 'http://localhost:3000'),

  SMTP_HOST: optional('SMTP_HOST', ''),
  SMTP_PORT: parseInt(optional('SMTP_PORT', '587'), 10),
  SMTP_USER: optional('SMTP_USER', ''),
  SMTP_PASS: optional('SMTP_PASS', ''),
  SMTP_FROM: optional('SMTP_FROM', 'no-reply@artofsavingmind.com'),

  BCRYPT_SALT_ROUNDS: parseInt(optional('BCRYPT_SALT_ROUNDS', '10'), 10),

  // =========================================
  // AI WELLNESS ASSISTANT (Phase 4.2)
  // =========================================
  // Intentionally optional here (not `required()`) so the rest of the
  // app keeps working if this hasn't been configured yet — ai.service
  // throws a clear error only when /api/ai/chat is actually called
  // without a key.
  OPENAI_API_KEY: optional('OPENAI_API_KEY', ''),
  OPENAI_MODEL: optional('OPENAI_MODEL', 'gpt-4o-mini'),

  // =========================================
  // RAZORPAY PAYMENT GATEWAY
  // =========================================
  RAZORPAY_KEY_ID: optional('RAZORPAY_KEY_ID', ''),
  RAZORPAY_KEY_SECRET: optional('RAZORPAY_KEY_SECRET', ''),

  get isProduction() {
    return this.NODE_ENV === 'production';
  },
};
