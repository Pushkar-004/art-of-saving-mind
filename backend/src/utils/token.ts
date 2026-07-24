import crypto from 'crypto';

// The raw token is what gets emailed/returned to the user. Only its
// SHA-256 hash is ever persisted, so a leaked database never exposes
// usable reset tokens.
export function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
