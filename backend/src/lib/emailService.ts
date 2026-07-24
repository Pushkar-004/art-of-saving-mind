/**
 * Email service (Phase 4.7 — Email Notifications)
 *
 * All public functions are fire-and-forget: they never throw.
 * A failed send is logged with console.error but the calling
 * operation continues normally — email failures must never
 * break the main API flow (per requirements).
 *
 * If SMTP is not configured (transporter === null) the functions
 * return silently, so the app works identically in development
 * without SMTP credentials.
 */

import { transporter } from '@/lib/mailer';
import { env } from '@/config/env';
import {
  appointmentBookedEmail,
  appointmentCancelledEmail,
  appointmentConfirmedEmail,
  appointmentRejectedEmail,
  appointmentRescheduledEmail,
  appointmentReminderEmail,
  passwordResetEmail,
  paymentVerifiedEmail,
  paymentRejectedEmail,
} from '@/lib/emailTemplates';

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    // SMTP not configured — skip sending, but log loudly per-attempt so a
    // "patient never got the email" report is traceable to a config issue
    // (rather than looking like a silent, unexplained failure). The
    // one-time startup warning in mailer.ts is easy to miss in production
    // logs; this makes every skipped send visible at the point of failure.
    // eslint-disable-next-line no-console
    console.warn(
      `[emailService] Skipped sending "${subject}" to ${to} — SMTP is not configured ` +
        '(SMTP_HOST/SMTP_USER/SMTP_PASS missing or empty in environment). ' +
        'Set these in your .env to enable outbound email.',
    );
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[emailService] Attempting to send "${subject}" to ${to} via ${env.SMTP_HOST}:${env.SMTP_PORT}...`);

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    // eslint-disable-next-line no-console
    console.log(
      `[emailService] Sent "${subject}" to ${to} (messageId: ${info.messageId ?? 'n/a'}, ` +
        `accepted: ${JSON.stringify(info.accepted ?? [])}, rejected: ${JSON.stringify(info.rejected ?? [])})`,
    );
  } catch (err: any) {
    // Never rethrow — callers must never fail because of email.
    // Log every field nodemailer/SMTP gives us (code/command/responseCode/response)
    // so a real send failure is distinguishable from a config issue at a glance,
    // instead of just the generic Error object.
    // eslint-disable-next-line no-console
    console.error(
      `[emailService] Failed to send "${subject}" to ${to}. ` +
        `code=${err?.code ?? 'n/a'} responseCode=${err?.responseCode ?? 'n/a'} ` +
        `command=${err?.command ?? 'n/a'} response=${err?.response ?? 'n/a'} ` +
        `message=${err?.message ?? err}`,
    );
  }
}

// ─── Appointment emails ───────────────────────────────────────────────────────

export async function sendAppointmentBookedEmail(params: {
  to: string;
  patientName: string;
  therapistName: string;
  service: string;
  dateLabel: string;
  time: string;
}): Promise<void> {
  const { subject, html } = appointmentBookedEmail(params);
  await send(params.to, subject, html);
}

export async function sendAppointmentConfirmedEmail(params: {
  to: string;
  patientName: string;
  therapistName: string;
  service: string;
  dateLabel: string;
  time: string;
}): Promise<void> {
  const { subject, html } = appointmentConfirmedEmail({
    ...params,
    frontendUrl: env.FRONTEND_URL,
  });
  await send(params.to, subject, html);
}

export async function sendAppointmentRejectedEmail(params: {
  to: string;
  patientName: string;
  therapistName: string;
  dateLabel: string;
  time: string;
  reason?: string;
}): Promise<void> {
  const { subject, html } = appointmentRejectedEmail(params);
  await send(params.to, subject, html);
}

export async function sendAppointmentCancelledEmail(params: {
  to: string;
  patientName: string;
  service: string;
  dateLabel: string;
  time: string;
  reason?: string;
}): Promise<void> {
  const { subject, html } = appointmentCancelledEmail({
    ...params,
    frontendUrl: env.FRONTEND_URL,
  });
  await send(params.to, subject, html);
}

export async function sendAppointmentRescheduledEmail(params: {
  to: string;
  patientName: string;
  service: string;
  dateLabel: string;
  time: string;
}): Promise<void> {
  const { subject, html } = appointmentRescheduledEmail({
    ...params,
    frontendUrl: env.FRONTEND_URL,
  });
  await send(params.to, subject, html);
}

// ─── Auth emails ──────────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(params: {
  to: string;
  userName: string;
  resetLink: string;
}): Promise<void> {
  const { subject, html } = passwordResetEmail({
    userName: params.userName,
    resetLink: params.resetLink,
    expiresMinutes: env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES,
  });
  await send(params.to, subject, html);
}

// ─── Payment emails (Phase 4.8) ───────────────────────────────────────────────

export async function sendPaymentVerifiedEmail(params: {
  to: string;
  patientName: string;
  therapistName: string;
  date: string;
  time: string;
}): Promise<void> {
  const { subject, html } = paymentVerifiedEmail(params);
  await send(params.to, subject, html);
}

export async function sendPaymentRejectedEmail(params: {
  to: string;
  patientName: string;
  therapistName: string;
  reason?: string;
}): Promise<void> {
  const { subject, html } = paymentRejectedEmail({
    patientName: params.patientName,
    therapistName: params.therapistName,
    reason: params.reason,
  });
  await send(params.to, subject, html);
}

// ─── Appointment Reminder email (Phase 4.8 scheduler) ─────────────────────────

export async function sendAppointmentReminderEmail(params: {
  to: string;
  patientName: string;
  service: string;
  dateLabel: string;
  time: string;
}): Promise<void> {
  const { subject, html } = appointmentReminderEmail({
    ...params,
    frontendUrl: env.FRONTEND_URL,
  });
  await send(params.to, subject, html);
}
