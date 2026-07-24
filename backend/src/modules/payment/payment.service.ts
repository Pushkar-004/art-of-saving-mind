import Razorpay from 'razorpay';
import crypto from 'crypto';
import { Payment, PaymentStatus, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';
import { PaymentDTO, PaymentSettingsDTO, RazorpayOrderDTO } from '@/modules/payment/payment.types';
import {
  SubmitPaymentInput,
  UpdatePaymentSettingsInput,
  VerifyRazorpayPaymentInput,
} from '@/modules/payment/payment.validation';
import { notificationService } from '@/modules/notification/notification.service';

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

// ─── Patient ─────────────────────────────────────────────────────────────────

/**
 * Fetch or auto-create the pending payment row for an appointment.
 * Auto-creation ensures the patient always has a payment record after booking.
 */
async function getOrCreateForPatient(
  appointmentId: string,
  patientUserId: string,
): Promise<PaymentDTO> {
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
  if (existing) return toPaymentDTO(existing);

  // Auto-create pending payment row
  const created = await prisma.payment.create({
    data: { appointmentId },
    include: { verifiedBy: true },
  });
  return toPaymentDTO(created);
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

  // Upsert so re-submissions update an existing pending row
  const record = await prisma.payment.upsert({
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

  // Notify admins a payment screenshot was uploaded
  void notificationService.notifyPaymentSubmitted({
    appointmentId,
    paymentId: record.id,
    patientName: appointment.patient?.user?.name ?? appointment.guestName ?? 'Patient',
  });

  return toPaymentDTO(record);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

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

const THERAPIST_NAME = 'Miss Pooja';

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
  const existing = await prisma.payment.findUnique({
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

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.verified,
      verifiedById: adminUserId,
      verifiedAt: new Date(),
      remarks: remarks ?? null,
    },
    include: { verifiedBy: true },
  });

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
  }

  return toPaymentDTO(updated);
}

async function rejectPayment(
  paymentId: string,
  adminUserId: string,
  remarks: string,
): Promise<PaymentDTO> {
  const existing = await prisma.payment.findUnique({
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
    throw AppError.conflict('Cannot reject a verified payment');
  }

  const updated = await prisma.payment.update({
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
  }

  return toPaymentDTO(updated);
}

// ─── Payment Settings ─────────────────────────────────────────────────────────

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

async function createRazorpayOrder(
  appointmentId: string,
  patientUserId: string,
): Promise<RazorpayOrderDTO> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { include: { user: true } } },
  });
  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.patient?.userId !== patientUserId) {
    throw AppError.forbidden('Not your appointment');
  }

  const settings = await getSettings();
  const amount = 2000; // ₹2000 default session fee
  const amountInPaise = amount * 100;

  // If Razorpay keys are not configured and we are in development, return a Sandbox mode mock order for testing
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    if (env.isProduction) {
      throw AppError.badRequest('Razorpay payment gateway is not configured on the server. Please contact support or use manual UPI payment.');
    }
    console.log('[Razorpay Dev Sandbox] API keys not found in .env, returning simulated test order.');
    return {
      orderId: `order_mock_${Date.now()}`,
      amount: amountInPaise,
      currency: 'INR',
      keyId: 'rzp_test_mock_sandbox',
      clinicName: settings.clinicName,
      description: `${appointment.service} Session Payment (Sandbox Mode)`,
      prefill: {
        name: appointment.patient?.user.name ?? appointment.guestName ?? '',
        email: appointment.patient?.user.email ?? appointment.guestEmail ?? '',
        phone: appointment.patient?.user.phone ?? appointment.guestPhone ?? '',
      },
    };
  }

  const existing = await prisma.payment.findUnique({ where: { appointmentId } });
  if (existing?.status === PaymentStatus.verified) {
    throw AppError.conflict('Payment for this appointment is already verified');
  }

  const razorpay = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: appointmentId.slice(0, 40),
  });

  return {
    orderId: order.id,
    amount: amountInPaise,
    currency: 'INR',
    keyId: env.RAZORPAY_KEY_ID,
    clinicName: settings.clinicName,
    description: `${appointment.service} Session Payment`,
    prefill: {
      name: appointment.patient?.user.name ?? appointment.guestName ?? '',
      email: appointment.patient?.user.email ?? appointment.guestEmail ?? '',
      phone: appointment.patient?.user.phone ?? appointment.guestPhone ?? '',
    },
  };
}

async function verifyRazorpayPayment(
  appointmentId: string,
  patientUserId: string,
  input: VerifyRazorpayPaymentInput,
): Promise<PaymentDTO> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: { include: { user: true } } },
  });
  if (!appointment) throw AppError.notFound('Appointment not found');
  if (appointment.patient?.userId !== patientUserId) {
    throw AppError.forbidden('Not your appointment');
  }

  // Handle Sandbox mode mock verification in development when keys aren't set
  const isMockOrder = input.razorpay_order_id.startsWith('order_mock_') || input.razorpay_signature === 'mock_signature_sandbox_mode';
  if (!env.isProduction && (!env.RAZORPAY_KEY_SECRET || isMockOrder)) {
    console.log('[Razorpay Dev Sandbox] Verifying mock order payment:', input.razorpay_payment_id);
  } else {
    if (!env.RAZORPAY_KEY_SECRET) {
      throw AppError.badRequest('Razorpay secret is not configured on the server.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== input.razorpay_signature) {
      throw AppError.badRequest('Invalid Razorpay payment signature. Payment verification failed.');
    }
  }

  const record = await prisma.payment.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      status: PaymentStatus.verified,
      transactionReference: input.razorpay_payment_id,
      remarks: 'Verified automatically via Razorpay online payment',
      verifiedAt: new Date(),
    },
    update: {
      status: PaymentStatus.verified,
      transactionReference: input.razorpay_payment_id,
      remarks: 'Verified automatically via Razorpay online payment',
      verifiedAt: new Date(),
    },
    include: { verifiedBy: true },
  });

  const patientUser = appointment.patient?.user;
  if (patientUser) {
    void notificationService.notifyPaymentVerified({
      appointmentId,
      recipientUserId: patientUser.id,
      therapistName: THERAPIST_NAME,
      service: appointment.service,
      date: formatDateLabel(appointment.date),
      time: formatTime(appointment.startTime),
    });
  }

  return toPaymentDTO(record);
}

export const paymentService = {
  getOrCreateForPatient,
  submitPayment,
  listAll,
  verifyPayment,
  rejectPayment,
  getSettings,
  updateSettings,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
