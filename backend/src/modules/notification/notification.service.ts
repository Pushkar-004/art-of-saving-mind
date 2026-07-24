import { Notification, NotificationType, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { NotificationDTO } from '@/modules/notification/notification.types';
import {
  sendAppointmentBookedEmail,
  sendAppointmentConfirmedEmail,
  sendAppointmentRejectedEmail,
  sendAppointmentCancelledEmail,
  sendAppointmentRescheduledEmail,
  sendPaymentVerifiedEmail,
  sendPaymentRejectedEmail,
} from '@/lib/emailService';

function toNotificationDTO(record: Notification): NotificationDTO {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    message: record.message,
    relatedAppointmentId: record.relatedAppointmentId,
    isRead: record.isRead,
    createdAt: record.createdAt.toISOString(),
  };
}

// ---------------- Read-side (used by the controller) ----------------

async function listMine(userId: string, unreadOnly = false): Promise<NotificationDTO[]> {
  const records = await prisma.notification.findMany({
    where: {
      recipientId: userId,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
  return records.map(toNotificationDTO);
}

async function getOwnedOrThrow(userId: string, notificationId: string): Promise<Notification> {
  const record = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!record || record.recipientId !== userId) {
    throw AppError.notFound('Notification not found');
  }
  return record;
}

async function markRead(userId: string, notificationId: string): Promise<NotificationDTO> {
  await getOwnedOrThrow(userId, notificationId);
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
  return toNotificationDTO(updated);
}

async function markAllRead(userId: string): Promise<{ updatedCount: number }> {
  const result = await prisma.notification.updateMany({
    where: { recipientId: userId, isRead: false },
    data: { isRead: true },
  });
  return { updatedCount: result.count };
}

// ---------------- Write-side (creation helpers) ----------------
// Called internally by other modules (currently the appointment
// module) whenever an appointment's status changes — never exposed
// as a public "create notification" API, since the only producer of
// notifications today is the appointment lifecycle plus the admin
// broadcast helper below.

async function create(
  recipientId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedAppointmentId?: string,
): Promise<NotificationDTO> {
  const record = await prisma.notification.create({
    data: {
      recipientId,
      type,
      title,
      message,
      relatedAppointmentId,
    },
  });
  return toNotificationDTO(record);
}

async function createForAllAdmins(
  type: NotificationType,
  title: string,
  message: string,
  relatedAppointmentId?: string,
): Promise<void> {
  const admins = await prisma.user.findMany({ where: { role: Role.admin }, select: { id: true } });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((admin) => ({
      recipientId: admin.id,
      type,
      title,
      message,
      relatedAppointmentId,
    })),
  });
}

/**
 * A new appointment was booked (by a patient or a guest).
 * - Admin(s) get an in-app notification (always).
 * - Patient/guest gets a "booking received" email (if email available).
 */
async function notifyAppointmentBooked(params: {
  appointmentId: string;
  patientName: string;
  patientEmail?: string | null; // present for guests (guestEmail) and logged-in patients
  therapistName: string;
  service: string;
  dateLabel: string;
  time: string;
}): Promise<void> {
  await createForAllAdmins(
    'appointment_booked',
    'New appointment booked',
    `${params.patientName} booked a ${params.service} appointment on ${params.dateLabel} at ${params.time}.`,
    params.appointmentId,
  );

  // Fire email for both logged-in patients and guests (guest provides email at booking time)
  if (params.patientEmail) {
    // eslint-disable-next-line no-console
    console.log(
      `[notificationService] Dispatching booking-confirmation email for appointment ${params.appointmentId} to ${params.patientEmail}`,
    );
    void sendAppointmentBookedEmail({
      to: params.patientEmail,
      patientName: params.patientName,
      therapistName: params.therapistName,
      service: params.service,
      dateLabel: params.dateLabel,
      time: params.time,
    }).catch((err) => {
      // sendAppointmentBookedEmail/emailService.send() already catches and logs
      // internally and should never reject — this is a defensive net so that if
      // anything upstream ever throws before reaching that try/catch (e.g. a bad
      // template argument), it still surfaces here instead of becoming a silent,
      // unhandled promise rejection tied to appointment ${params.appointmentId}.
      // eslint-disable-next-line no-console
      console.error(
        `[notificationService] Unexpected error dispatching booking email for appointment ${params.appointmentId}:`,
        err,
      );
    });
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      `[notificationService] No email address available for appointment ${params.appointmentId} ` +
        `(patient: ${params.patientName}) — booking confirmation email was not sent.`,
    );
  }
}

async function notifyAppointmentConfirmed(params: {
  appointmentId: string;
  recipientUserId: string;
  therapistName: string;
  service: string;
  dateLabel: string;
  time: string;
}): Promise<void> {
  await create(
    params.recipientUserId,
    'appointment_confirmed',
    'Appointment confirmed',
    `Your ${params.service} appointment on ${params.dateLabel} at ${params.time} has been confirmed.`,
    params.appointmentId,
  );

  // Look up the user's email to send the confirmation email
  const user = await prisma.user.findUnique({
    where: { id: params.recipientUserId },
    select: { email: true, name: true },
  });
  if (user) {
    void sendAppointmentConfirmedEmail({
      to: user.email,
      patientName: user.name,
      therapistName: params.therapistName,
      service: params.service,
      dateLabel: params.dateLabel,
      time: params.time,
    });
  }
}

async function notifyAppointmentRejected(params: {
  appointmentId: string;
  recipientUserId: string;
  therapistName: string;
  service: string;
  dateLabel: string;
  time: string;
  reason?: string;
}): Promise<void> {
  const reasonSuffix = params.reason ? ` Reason: ${params.reason}` : '';
  await create(
    params.recipientUserId,
    'appointment_cancelled',
    'Appointment rejected',
    `Your ${params.service} appointment request on ${params.dateLabel} at ${params.time} has been rejected.${reasonSuffix}`,
    params.appointmentId,
  );

  const user = await prisma.user.findUnique({
    where: { id: params.recipientUserId },
    select: { email: true, name: true },
  });
  if (user) {
    void sendAppointmentRejectedEmail({
      to: user.email,
      patientName: user.name,
      therapistName: params.therapistName,
      dateLabel: params.dateLabel,
      time: params.time,
      reason: params.reason,
    });
  }
}

async function notifyAppointmentCancelled(params: {
  appointmentId: string;
  recipientUserId: string;
  service: string;
  dateLabel: string;
  time: string;
  reason?: string;
}): Promise<void> {
  const reasonSuffix = params.reason ? ` Reason: ${params.reason}` : '';
  await create(
    params.recipientUserId,
    'appointment_cancelled',
    'Appointment cancelled',
    `Your ${params.service} appointment on ${params.dateLabel} at ${params.time} has been cancelled.${reasonSuffix}`,
    params.appointmentId,
  );

  const user = await prisma.user.findUnique({
    where: { id: params.recipientUserId },
    select: { email: true, name: true },
  });
  if (user) {
    void sendAppointmentCancelledEmail({
      to: user.email,
      patientName: user.name,
      service: params.service,
      dateLabel: params.dateLabel,
      time: params.time,
      reason: params.reason,
    });
  }
}

async function notifyAppointmentRescheduled(params: {
  appointmentId: string;
  recipientUserId: string;
  service: string;
  dateLabel: string;
  time: string;
}): Promise<void> {
  await create(
    params.recipientUserId,
    'appointment_rescheduled',
    'Appointment rescheduled',
    `Your ${params.service} appointment has been rescheduled to ${params.dateLabel} at ${params.time}.`,
    params.appointmentId,
  );

  const user = await prisma.user.findUnique({
    where: { id: params.recipientUserId },
    select: { email: true, name: true },
  });
  if (user) {
    void sendAppointmentRescheduledEmail({
      to: user.email,
      patientName: user.name,
      service: params.service,
      dateLabel: params.dateLabel,
      time: params.time,
    });
  }
}

/** General admin-authored notification, e.g. a broadcast to a specific patient. */
async function notifyGeneralAdmin(params: {
  recipientUserId: string;
  title: string;
  message: string;
}): Promise<NotificationDTO> {
  return create(params.recipientUserId, 'general_admin', params.title, params.message);
}

// ─── Payment notifications (Phase 4.8) ───────────────────────────────────────

async function notifyPaymentSubmitted(params: {
  appointmentId: string;
  paymentId: string;
  patientName: string;
}): Promise<void> {
  await createForAllAdmins(
    'general_admin',
    'Payment screenshot uploaded',
    `${params.patientName} uploaded a payment screenshot for appointment. Please review and verify.`,
    params.appointmentId,
  );
}

async function notifyPaymentVerified(params: {
  appointmentId: string;
  recipientUserId: string;
  therapistName: string;
  service: string;
  date: string;
  time: string;
}): Promise<void> {
  await create(
    params.recipientUserId,
    'general_admin',
    'Payment verified',
    `Your payment for the ${params.service} appointment has been verified. Your appointment is confirmed.`,
    params.appointmentId,
  );

  const user = await prisma.user.findUnique({
    where: { id: params.recipientUserId },
    select: { email: true, name: true },
  });
  if (user) {
    void sendPaymentVerifiedEmail({
      to: user.email,
      patientName: user.name,
      therapistName: params.therapistName,
      date: params.date,
      time: params.time,
    });
  }
}

async function notifyPaymentRejected(params: {
  appointmentId: string;
  recipientUserId: string;
  therapistName: string;
  service: string;
  remarks: string;
}): Promise<void> {
  await create(
    params.recipientUserId,
    'general_admin',
    'Payment rejected',
    `Your payment for the ${params.service} appointment was rejected. Reason: ${params.remarks}. Please re-upload a valid payment screenshot.`,
    params.appointmentId,
  );

  const user = await prisma.user.findUnique({
    where: { id: params.recipientUserId },
    select: { email: true, name: true },
  });
  if (user) {
    void sendPaymentRejectedEmail({
      to: user.email,
      patientName: user.name,
      therapistName: params.therapistName,
      reason: params.remarks,
    });
  }
}

async function notifyAppointmentReminder(params: {
  appointmentId: string;
  recipientUserId: string;
  service: string;
  dateLabel: string;
  time: string;
}): Promise<void> {
  await create(
    params.recipientUserId,
    'general_admin',
    'Appointment reminder',
    `Reminder: Your ${params.service} appointment is scheduled for ${params.dateLabel} at ${params.time}.`,
    params.appointmentId,
  );
}

export const notificationService = {
  listMine,
  markRead,
  markAllRead,
  notifyAppointmentBooked,
  notifyAppointmentConfirmed,
  notifyAppointmentRejected,
  notifyAppointmentCancelled,
  notifyAppointmentRescheduled,
  notifyGeneralAdmin,
  notifyPaymentSubmitted,
  notifyPaymentVerified,
  notifyPaymentRejected,
  notifyAppointmentReminder,
};
