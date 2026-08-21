/**
 * Nodemailer Transporter Configuration
 *
 * This module configures and exports a single, shared Nodemailer transporter.
 *
 * How it works:
 * 1. It reads SMTP configuration from environment variables (`env`).
 * 2. If essential variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are present, it creates and configures a `transporter`.
 * 3. It immediately attempts to verify the SMTP connection and credentials.
 *
 * Error Handling:
 * - If config is missing, `transporter` remains `null`, and a warning is logged. The app will run, but email sending will be disabled.
 * - If verification fails (e.g., wrong password/API key), a detailed error is logged to the console, guiding the developer to the likely problem.
 *
 * This aggressive, upfront verification ensures that configuration issues are detected at server startup, not silently during a runtime operation.
 */
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '@/config/env';

let transporter: Transporter | null = null;

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = env;
const isSmtpConfigured = SMTP_HOST && SMTP_USER && SMTP_PASS;

/** Redacts a value for logging, keeping the first and last two characters. */
function redact(value: string): string {
  if (!value) return '(not set)';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}...${value.slice(-2)}`;
}

if (isSmtpConfigured) {
  const isSecure = SMTP_PORT === 465;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS, // For services like SendGrid/GMass, this is usually the API Key
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `[mailer] SMTP configured: host=${SMTP_HOST}, port=${SMTP_PORT}, secure=${isSecure}, user=${redact(
      SMTP_USER,
    )}, from=${SMTP_FROM}. Verifying connection...`,
  );

  transporter
    .verify()
    .then(() => {
      // eslint-disable-next-line no-console
      console.log(`[mailer] SMTP connection successful. Email sending is enabled.`);
    })
    .catch((err: any) => {
      let guidance =
        'Please double-check your SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables in the .env file.';

      if (err.code === 'EAUTH' || err.responseCode === 535) {
        guidance =
          `Authentication failed. The username or password (API Key) is incorrect. ` +
          `\n> 1. Verify SMTP_USER ("${redact(SMTP_USER)}") is correct. ` +
          `\n> 2. Re-generate your API Key or App Password and update the SMTP_PASS value in your .env file. ` +
          `\n> 3. Note: If you do not need email sending for local development, you can ignore this warning or leave SMTP variables empty in your .env file.`;
      } else if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
        guidance = `The connection to the SMTP server timed out or was reset. Check for firewalls or network issues blocking port ${SMTP_PORT}.`;
      }

      // eslint-disable-next-line no-console
      console.warn(
        `[mailer] WARNING: SMTP connection failed. Email sending is disabled.`,
        `\n> Error: ${err.message}`,
        `\n> Code: ${err.code || 'N/A'}`,
        `\n> Guidance:\n> ${guidance}\n`,
      );
    });
} else {
  const missingVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter((key) => !env[key as keyof typeof env]);
  // eslint-disable-next-line no-console
  console.warn(
    `[mailer] SMTP not configured. Email sending is disabled.`,
    `\n> Reason: The following environment variables are missing or empty: ${missingVars.join(', ')}.`,
    `\n> To fix this, set them in your .env file and restart the server.`,
  );
}

export { transporter };
