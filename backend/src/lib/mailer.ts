/**
 * Nodemailer transporter (Phase 4.7 — Email Notifications)
 *
 * A single shared transporter is created at module load time.
 * If SMTP credentials are not configured the module still loads
 * without error — emails are simply skipped (emailService guards
 * against a null transporter before every send attempt).
 *
 * Required environment variables for outbound email to work:
 *   SMTP_HOST  - SMTP server hostname (e.g. smtp.gmail.com, smtp.sendgrid.net)
 *   SMTP_PORT  - SMTP port (587 for STARTTLS, 465 for implicit TLS) — defaults to 587
 *   SMTP_USER  - SMTP auth username
 *   SMTP_PASS  - SMTP auth password / app password / API key
 *   SMTP_FROM  - "From" address used on outgoing mail — defaults to no-reply@artofsavingmind.com
 *
 * If SMTP_HOST/SMTP_USER/SMTP_PASS are missing, `transporter` stays
 * null and every call to emailService.send() logs a per-attempt
 * warning and returns without sending (see emailService.ts).
 */
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '@/config/env';

let transporter: Transporter | null = null;

// Diagnostic-only helper: names exactly which required SMTP vars are
// absent, so a misconfiguration is provable from a log line instead of
// a generic "SMTP not configured" message. Does not change behavior —
// the enable/disable decision below still uses the original
// `env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS` condition.
function missingSmtpVars(): string[] {
  const missing: string[] = [];
  if (!env.SMTP_HOST) missing.push('SMTP_HOST');
  if (!env.SMTP_USER) missing.push('SMTP_USER');
  if (!env.SMTP_PASS) missing.push('SMTP_PASS');
  return missing;
}

/** Redacts a value for logging: keeps enough to confirm it's set/non-empty without leaking secrets. */
function redact(value: string): string {
  if (!value) return '(empty)';
  if (value.length <= 4) return '*'.repeat(value.length);
  return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`;
}

if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for port 465, false for 587/25
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `[mailer] SMTP configured: host=${env.SMTP_HOST} port=${env.SMTP_PORT} ` +
      `secure=${env.SMTP_PORT === 465} user=${redact(env.SMTP_USER)} from=${env.SMTP_FROM} ` +
      '— attempting connection verification now...',
  );

  // Verify the connection/auth at startup (not on first real send) so a
  // wrong host/port/credential combo is caught and logged immediately,
  // rather than failing silently the first time a patient books an
  // appointment. This does not block server startup.
  transporter
    .verify()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(`[mailer] SMTP connection verified (${env.SMTP_HOST}:${env.SMTP_PORT}) — email sending enabled.`);
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        `[mailer] SMTP connection/auth check FAILED for ${env.SMTP_HOST}:${env.SMTP_PORT}. ` +
          'Emails will be ATTEMPTED but will fail at send time until this is fixed ' +
          '(the transporter is not disabled just because verify() failed). ' +
          `Reason: code=${err?.code ?? 'n/a'} responseCode=${err?.responseCode ?? 'n/a'} ` +
          `command=${err?.command ?? 'n/a'} message=${err?.message ?? err}`,
      );
    });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    `[mailer] SMTP credentials not configured — email sending disabled. Missing: ` +
      `${missingSmtpVars().join(', ')}. Set these in your .env (and restart the server — ` +
      'dotenv is only read at process start) to enable outbound email. ' +
      'Every skipped send will also be logged individually by emailService at the point of failure.',
  );
}

export { transporter };
