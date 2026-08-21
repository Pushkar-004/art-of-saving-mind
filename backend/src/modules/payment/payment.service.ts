import { Payment, PaymentStatus, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';
import { PaymentDTO, PaymentSettingsDTO, PaymentWithPriceDTO } from '@/modules/payment/payment.types';
import {
  SubmitPaymentInput,
  UpdatePaymentSettingsInput,
} from '@/modules/payment/payment.validation';
import { notificationService } from '@/modules/notification/notification.service';
import {
  getAppointmentPriceInPaise,
  getSessionDurationMinutes,
} from '@/lib/servicePricing';

type PaymentWithVerifier = Payment & { verifiedBy: User | null };

function toPaymentDTO(record: PaymentWithVerifier): PaymentDTO {
  return {
    id: record.id,
    appointmentId: record.appointmentId,
    status: record.status as PaymentDTO['status'],
    screenshotUrl: record.screenshotUrl,
    transactionReference: record.transactionReference,
    remarks: record.remarks,
    verifiedById: record.verifiedById,
    verifiedByName: record.verifiedBy?.name ?? null,
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
  };
}

// â”€â”€â”€ Patient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * Fetch or auto-create the pending payment row for an appointment.
 * Auto-creation ensures the patient always has a payment record after booking.
 */
async function getOrCreateForPatient(
  appointmentId: string,
  patientUserId: string,
): Promise<PaymentWithPriceDTO> {
  // Verify the appointment belongs to this patient
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { select: { userId: true } } },
  });
  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.patient?.userId !== patientUserId) {
    throw AppError.forbidden('Not your appointment');
  }

  const existing = await prisma.payment.findUnique({
    where: { appointmentId },
    include: { verifiedBy: true },
  });

  const paymentRecord = existing ?? await prisma.payment.create({
    data: { appointmentId },
    include: { verifiedBy: true },
  });

  const durationMinutes = getSessionDurationMinutes(
    appointment.startTime,
    appointment.endTime,
  );
  const amountInPaise = getAppointmentPriceInPaise(
    appointment.service,
    appointment.mode,
    durationMinutes,
  );

  return {
    ...toPaymentDTO(paymentRecord),
    amountInPaise,
  };
}

async function submitPayment(
  appointmentId: string,
  patientUserId: string,
  input: SubmitPaymentInput,
): Promise<PaymentDTO> {
  // Ensure appointment belongs to patient
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { select: { userId: true, user: { select: { name: true } } } } },
  });
  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.patient?.userId !== patientUserId) {
    throw AppError.forbidden('Not your appointment');
  }
  if (appointment.status === 'cancelled') {
    throw AppError.badRequest('This appointment was cancelled and no payment can be submitted.');
  }

  // Upsert so re-submissions update an existing pending row
  const record = await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: { appointmentId },
      include: { verifiedBy: true },
    });

    if (existing?.status === PaymentStatus.verified) {
      throw AppError.conflict('Payment already verified for this appointment');
    }

    if (input.transactionReference) {
      const usedByAnother = await tx.payment.findFirst({
        where: { transactionReference: input.transactionReference },
        include: { verifiedBy: true },
      });
      if (usedByAnother && usedByAnother.appointmentId !== appointmentId) {
        throw AppError.conflict('This transaction reference has already been used for another appointment.');
      }
    }

    return tx.payment.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        screenshotUrl: input.screenshotUrl,
        transactionReference: input.transactionReference ?? null,
        status: PaymentStatus.pending,
      },
      update: {
        screenshotUrl: input.screenshotUrl,
        transactionReference: input.transactionReference ?? null,
        status: PaymentStatus.pending,
        remarks: null,
        verifiedById: null,
        verifiedAt: null,
      },
      include: { verifiedBy: true },
    });
  });

  // Notify admins a payment screenshot was uploaded
  void notificationService.notifyPaymentSubmitted({
    appointmentId,
    paymentId: record.id,
    patientName: appointment.patient?.user?.name ?? appointment.guestName ?? 'Patient',
  });

  return toPaymentDTO(record);
}

// â”€â”€â”€ Admin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function listAll(): Promise<(PaymentDTO & { patientName: string; service: string; date: string })[]> {
  const records = await prisma.payment.findMany({
    include: {
      verifiedBy: true,
      appointment: {
        select: {
          service: true,
          date: true,
          guestName: true,
          patient: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return records.map((r) => ({
    ...toPaymentDTO(r),
    patientName: r.appointment.patient?.user.name ?? r.appointment.guestName ?? 'Guest',
    service: r.appointment.service,
    date: r.appointment.date.toISOString().split('T')[0],
  }));
}

const THERAPIST_NAME = 'Miss. Pooja Sunil Ghadge';

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

async function verifyPayment(
  paymentId: string,
  adminUserId: string,
  remarks?: string,
): Promise<PaymentDTO> {
  const updatedPayment = await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        verifiedBy: true,
        appointment: {
          include: { patient: { include: { user: true } } },
        },
      },
    });
    if (!existing) throw AppError.notFound('Payment not found');
    if (existing.status === PaymentStatus.verified) {
      throw AppError.conflict('Payment already verified');
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.verified,
        verifiedById: adminUserId,
        verifiedAt: new Date(),
        remarks: remarks ?? null,
      },
      include: { verifiedBy: true },
    });

    if (existing.appointment.status === 'pending') {
      await tx.appointment.update({
        where: { id: existing.appointmentId },
        data: { status: 'upcoming' },
      });
    }

    const patientUser = existing.appointment.patient?.user;
    if (patientUser) {
      void notificationService.notifyPaymentVerified({
        appointmentId: existing.appointmentId,
        recipientUserId: patientUser.id,
        therapistName: THERAPIST_NAME,
        service: existing.appointment.service,
        date: formatDateLabel(existing.appointment.date),
        time: formatTime(existing.appointment.startTime),
      });
    } else {
      void notificationService.notifyPaymentVerified({
        appointmentId: existing.appointmentId,
        recipientUserId: '',
        therapistName: THERAPIST_NAME,
        service: existing.appointment.service,
        date: formatDateLabel(existing.appointment.date),
        time: formatTime(existing.appointment.startTime),
        guestEmail: existing.appointment.guestEmail,
        guestPhone: existing.appointment.guestPhone,
      });
    }

    return updated;
  });

  return toPaymentDTO(updatedPayment);
}

async function rejectPayment(
  paymentId: string,
  adminUserId: string,
  remarks: string,
): Promise<PaymentDTO> {
  const rejectedPayment = await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        appointment: {
          include: { patient: { include: { user: true } } },
        },
      },
    });
    if (!existing) throw AppError.notFound('Payment not found');
    if (existing.status === PaymentStatus.verified) {
      throw AppError.conflict('Cannot reject a verified payment');
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.rejected,
        verifiedById: adminUserId,
        verifiedAt: new Date(),
        remarks,
      },
      include: { verifiedBy: true },
    });

    const patientUser = existing.appointment.patient?.user;
    if (patientUser) {
      void notificationService.notifyPaymentRejected({
        appointmentId: existing.appointmentId,
        recipientUserId: patientUser.id,
        therapistName: THERAPIST_NAME,
        service: existing.appointment.service,
        remarks,
      });
    } else {
      void notificationService.notifyPaymentRejected({
        appointmentId: existing.appointmentId,
        recipientUserId: '',
        therapistName: THERAPIST_NAME,
        service: existing.appointment.service,
        remarks,
        guestEmail: existing.appointment.guestEmail,
        guestPhone: existing.appointment.guestPhone,
      });
    }

    return updated;
  });

  return toPaymentDTO(rejectedPayment);
}

// â”€â”€â”€ Payment Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function getSettings(): Promise<PaymentSettingsDTO> {
  let settings = await prisma.paymentSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.paymentSettings.create({
      data: {
        id: 'default',
        clinicName: 'Art of Saving Mind',
        upiId: '8766804788@ybl',
        qrImageUrl: '/upi-qr.jpg',
        paymentInstructions:
          'Please complete the payment via PhonePe or any UPI app using the QR code or UPI ID above. Upload a clear screenshot of the successful transaction. Your appointment will be confirmed once the payment is verified by the clinic.',
      },
    });
  }
  return {
    clinicName: settings.clinicName,
    upiId: settings.upiId,
    qrImageUrl: settings.qrImageUrl,
    paymentInstructions: settings.paymentInstructions,
  };
}

async function updateSettings(input: UpdatePaymentSettingsInput): Promise<PaymentSettingsDTO> {
  const settings = await prisma.paymentSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      clinicName: input.clinicName ?? 'Art of Saving Mind',
      upiId: input.upiId ?? '8766804788@ybl',
      qrImageUrl: input.qrImageUrl ?? null,
      paymentInstructions: input.paymentInstructions ?? null,
    },
    update: {
      ...(input.clinicName !== undefined ? { clinicName: input.clinicName } : {}),
      ...(input.upiId !== undefined ? { upiId: input.upiId } : {}),
      ...(input.qrImageUrl !== undefined ? { qrImageUrl: input.qrImageUrl } : {}),
      ...(input.paymentInstructions !== undefined
        ? { paymentInstructions: input.paymentInstructions }
        : {}),
    },
  });
  return {
    clinicName: settings.clinicName,
    upiId: settings.upiId,
    qrImageUrl: settings.qrImageUrl,
    paymentInstructions: settings.paymentInstructions,
  };
}

/*
 * Online gateway functions formerly followed here. Manual payment-proof
 * collection and admin verification remain the supported payment flow.
 */
export const paymentService = {
  getOrCreateForPatient,
  submitPayment,
  listAll,
  verifyPayment,
  rejectPayment,
  getSettings,
  updateSettings,
};
