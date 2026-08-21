/**
 * Email templates (Phase 4.7 — Email Notifications)
 *
 * Each function returns { subject, html } ready to be passed
 * directly to nodemailer's `sendMail` options.
 *
 * Design: single-column, inline-friendly HTML that renders well ins
 * Gmail / Outlook without requiring external CSS files.
 */

const BRAND_NAME = 'Art of Saving Mind';
const BRAND_COLOR = '#4f46e5'; // indigo-600 — matches frontend theme
const BRAND_COLOR_LIGHT = '#eef2ff'; // indigo-50
const FONT_STACK = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

function layout(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:${FONT_STACK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;
                 overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_COLOR};padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                ${BRAND_NAME}
              </h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                Your Mental Wellness Partner
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.6;">
                This is an automated message from ${BRAND_NAME}.<br />
                Please do not reply to this email.
              </p>
              <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function infoBox(content: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background-color:${BRAND_COLOR_LIGHT};border-radius:8px;margin:24px 0;">
      <tr>
        <td style="padding:20px 24px;color:#3730a3;font-size:14px;line-height:1.7;">
          ${content}
        </td>
      </tr>
    </table>`;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;color:#6b7280;font-size:13px;width:130px;vertical-align:top;">
        ${label}
      </td>
      <td style="padding:8px 0;color:#111827;font-size:13px;font-weight:600;vertical-align:top;">
        ${value}
      </td>
    </tr>`;
}

function detailTable(rows: { label: string; value: string }[]): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0"
      style="width:100%;border-top:1px solid #e5e7eb;margin-top:24px;">
      ${rows.map((r) => detailRow(r.label, r.value)).join('')}
    </table>`;
}

function ctaButton(text: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
      <tr>
        <td>
          <a href="${href}"
            style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;
                   text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;
                   border-radius:8px;letter-spacing:0.2px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

// ─── 1. Appointment Booked ────────────────────────────────────────────────────

export function appointmentBookedEmail(params: {
  patientName: string;
  therapistName: string;
  service: string;
  dateLabel: string;
  time: string;
}): { subject: string; html: string } {
  const subject = 'Booking Request Received — Payment Verification Required';

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hello ${params.patientName},
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      We have received your booking request. Your appointment is pending payment verification and is not confirmed yet.
    </p>

    ${detailTable([
      { label: 'Therapist', value: params.therapistName },
      { label: 'Date', value: params.dateLabel },
      { label: 'Time', value: params.time },
      { label: 'Status', value: 'Pending payment verification' },
    ])}

    <p style="margin:24px 0 0;color:#374151;font-size:15px;line-height:1.6;">
      Thank you for choosing Art of Saving Mind.
    </p>`;

  return { subject, html: layout(body) };
}

// ─── 2. Appointment Confirmed ─────────────────────────────────────────────────

export function appointmentConfirmedEmail(params: {
  patientName: string;
  therapistName: string;
  service: string;
  dateLabel: string;
  time: string;
  frontendUrl: string;
}): { subject: string; html: string } {
  const subject = 'Appointment Approved';

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hello ${params.patientName},
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      Your appointment has been approved.
    </p>

    ${detailTable([
      { label: 'Therapist', value: params.therapistName },
      { label: 'Date', value: params.dateLabel },
      { label: 'Time', value: params.time },
    ])}

    <p style="margin:24px 0 0;color:#374151;font-size:15px;line-height:1.6;">
      We look forward to seeing you.
    </p>
    <p style="margin:12px 0 0;color:#374151;font-size:15px;line-height:1.6;">
      Thank you,<br />
      Art of Saving Mind
    </p>`;

  return { subject, html: layout(body) };
}

// ─── 3. Appointment Rejected ──────────────────────────────────────────────────

export function appointmentRejectedEmail(params: {
  patientName: string;
  therapistName: string;
  dateLabel: string;
  time: string;
  reason?: string;
}): { subject: string; html: string } {
  const subject = 'Appointment Rejected';

  const detailRows: { label: string; value: string }[] = [
    { label: 'Therapist', value: params.therapistName },
    { label: 'Date', value: params.dateLabel },
    { label: 'Time', value: params.time },
  ];
  if (params.reason) {
    detailRows.push({ label: 'Reason', value: params.reason });
  }

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hello ${params.patientName},
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      Unfortunately, your appointment request has been rejected.
    </p>

    ${detailTable(detailRows)}

    <p style="margin:24px 0 0;color:#374151;font-size:15px;line-height:1.6;">
      Please book another appointment at your convenience.
    </p>
    <p style="margin:12px 0 0;color:#374151;font-size:15px;line-height:1.6;">
      Thank you,<br />
      Art of Saving Mind
    </p>`;

  return { subject, html: layout(body) };
}

// ─── 4. Appointment Cancelled ─────────────────────────────────────────────────

export function appointmentCancelledEmail(params: {
  patientName: string;
  service: string;
  dateLabel: string;
  time: string;
  reason?: string;
  frontendUrl: string;
}): { subject: string; html: string } {
  const subject = `Appointment Cancelled — ${params.service} on ${params.dateLabel}`;

  const detailRows = [
    { label: 'Service', value: params.service },
    { label: 'Date', value: params.dateLabel },
    { label: 'Time', value: params.time },
  ];
  if (params.reason) {
    detailRows.push({ label: 'Reason', value: params.reason });
  }

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">
      Appointment Cancelled
    </h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${params.patientName}, we are writing to let you know that the following
      appointment has been cancelled.
    </p>

    ${detailTable(detailRows)}

    <p style="margin:20px 0 0;color:#374151;font-size:14px;line-height:1.6;">
      We apologise for any inconvenience. You can book a new appointment at any
      time from your dashboard.
    </p>

    ${ctaButton('Book a New Appointment', `${params.frontendUrl}/appointment-booking`)}`;

  return { subject, html: layout(body) };
}

// ─── 4. Appointment Rescheduled ───────────────────────────────────────────────

export function appointmentRescheduledEmail(params: {
  patientName: string;
  service: string;
  dateLabel: string;
  time: string;
  frontendUrl: string;
}): { subject: string; html: string } {
  const subject = `Appointment Rescheduled — ${params.service} now on ${params.dateLabel}`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">
      Appointment Rescheduled
    </h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${params.patientName}, your appointment has been rescheduled to a new
      date and time. The details are below.
    </p>

    ${infoBox(`
      <strong style="display:block;margin-bottom:6px;">New Schedule</strong>
      <span>📋 Service: ${params.service}</span><br/>
      <span>📅 New Date: ${params.dateLabel}</span><br/>
      <span>🕐 New Time: ${params.time}</span>
    `)}

    <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
      Your appointment is now <strong>pending re-confirmation</strong>. We will
      send another email once it has been confirmed.
    </p>

    ${ctaButton('View My Appointments', `${params.frontendUrl}/dashboard/patient/appointments`)}`;

  return { subject, html: layout(body) };
}

// ─── 5. Password Reset ────────────────────────────────────────────────────────

export function passwordResetEmail(params: {
  userName: string;
  resetLink: string;
  expiresMinutes: number;
}): { subject: string; html: string } {
  const subject = `Reset your ${BRAND_NAME} password`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">
      Password Reset Request
    </h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${params.userName}, we received a request to reset the password for your
      account. Click the button below to choose a new password.
    </p>

    ${ctaButton('Reset My Password', params.resetLink)}

    <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
      This link will expire in <strong>${params.expiresMinutes} minutes</strong>.
      If you did not request a password reset, you can safely ignore this email —
      your password will remain unchanged.
    </p>
    <p style="margin:12px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
      If the button above does not work, copy and paste the link below into your
      browser:<br/>
      <span style="color:${BRAND_COLOR};word-break:break-all;">${params.resetLink}</span>
    </p>`;

  return { subject, html: layout(body) };
}

// ─── Payment email templates (Phase 4.8) ─────────────────────────────────────

export function paymentVerifiedEmail(params: {
  patientName: string;
  therapistName: string;
  date: string;
  time: string;
}): { subject: string; html: string } {
  const subject = 'Payment Verified';

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hello ${params.patientName},
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      Your payment has been verified successfully.
    </p>

    ${detailTable([
      { label: 'Therapist', value: params.therapistName },
      { label: 'Appointment Date', value: params.date },
      { label: 'Appointment Time', value: params.time },
    ])}

    <p style="margin:24px 0 0;color:#374151;font-size:15px;line-height:1.6;">
      We look forward to seeing you.
    </p>
    <p style="margin:12px 0 0;color:#374151;font-size:15px;line-height:1.6;">
      Thank you,<br />
      Art of Saving Mind
    </p>`;

  return { subject, html: layout(body) };
}

export function paymentRejectedEmail(params: {
  patientName: string;
  therapistName: string;
  reason?: string;
}): { subject: string; html: string } {
  const subject = 'Payment Proof Rejected';

  const reasonSection = params.reason
    ? `
    <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
      <strong>Reason:</strong>
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      ${params.reason}
    </p>`
    : '';

  const body = `
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hello ${params.patientName},
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
      We could not verify your payment proof.
    </p>

    <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
      <strong>Therapist:</strong>
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      ${params.therapistName}
    </p>

    ${reasonSection}

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Please upload a new payment screenshot from your dashboard.
    </p>
    <p style="margin:12px 0 0;color:#374151;font-size:15px;line-height:1.6;">
      Thank you,<br />
      Art of Saving Mind
    </p>`;

  return { subject, html: layout(body) };
}

export function appointmentReminderEmail(params: {
  patientName: string;
  service: string;
  dateLabel: string;
  time: string;
  frontendUrl: string;
}): { subject: string; html: string } {
  const subject = `Reminder: Your appointment is tomorrow — ${BRAND_NAME}`;

  const body = `
    <h2 style="margin:0 0 8px;font-size:20px;color:#111827;font-weight:700;">
      Appointment Reminder
    </h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Hi ${params.patientName}, this is a friendly reminder about your upcoming appointment.
    </p>
    ${detailTable([
      { label: 'Service', value: params.service },
      { label: 'Date', value: params.dateLabel },
      { label: 'Time', value: params.time },
    ])}
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
      Please ensure you are available at the scheduled time. If you need to reschedule,
      please do so as early as possible.
    </p>
    ${ctaButton('View My Appointments', `${params.frontendUrl}/dashboard/patient/appointments`)}`;

  return { subject, html: layout(body) };
}
