import { Appointment, AppointmentStatus, Patient, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { dayOfWeekFromDate, parseDateOnly, startOfToday, toDateKey } from '@/utils/date';
import { availabilityService } from '@/modules/availability/availability.service';
import {
  BookAppointmentInput,
  RescheduleAppointmentInput,
} from '@/modules/appointment/appointment.validation';
import { AppointmentDTO } from '@/modules/appointment/appointment.types';
import { notificationService } from '@/modules/notification/notification.service';

const THERAPIST_NAME = 'Miss Pooja'; // matches every mock appointment record (single-practitioner practice)

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return initials || 'NA';
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Builds the human-readable `date` label the frontend already shows
 * ("Today" / "Tomorrow" / "Thursday, Mar 28" / "Mar 8, 2024"),
 * matching the conventions visible across mock-data/appointments.ts.
 */
function formatDateLabel(date: Date): string {
  const today = startOfToday();
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';

  const sameYear = target.getFullYear() === today.getFullYear();
  const withinWeek = diffDays > 1 && diffDays < 7;

  if (withinWeek) {
    return target.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  return sameYear
    ? target.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
    : target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type AppointmentWithPatient = Appointment & {
  patient: (Patient & { user: User }) | null;
};

function toAppointmentDTO(record: AppointmentWithPatient): AppointmentDTO {
  const isGuest = !record.patient;
  const patientName = record.patient?.user.name ?? record.guestName ?? 'Guest';
  const patientInitials = record.patient
    ? record.patient.user.avatarInitials ?? getInitials(record.patient.user.name)
    : getInitials(record.guestName ?? 'Guest');

  return {
    id: record.id,
    patientId: record.patientId,
    patientName,
    patientInitials,
    service: record.service,
    therapist: THERAPIST_NAME,
    date: formatDateLabel(record.date),
    day: record.date.getDate().toString().padStart(2, '0'),
    month: record.date.toLocaleDateString('en-US', { month: 'short' }),
    dateTime: `${toDateKey(record.date)}T${record.startTime}`,
    time: formatTime(record.startTime),
    type: record.mode,
    status: record.status,
    notes: record.notes ?? undefined,
    guestEmail: record.guestEmail,
    guestPhone: record.guestPhone,
    isGuest,
  };
}

const APPOINTMENT_INCLUDE = { patient: { include: { user: true } } } as const;

/**
 * Shared by both the public guest flow and the logged-in patient
 * flow. `patientId` is null for guest bookings. Re-validates the
 * requested slot against live availability data (not whatever the
 * client's UI last rendered) before creating the row, so a stale
 * frontend slot list can never create a double-booking.
 */
async function book(
  input: BookAppointmentInput,
  patientId: string | null,
): Promise<AppointmentDTO> {
  if (!patientId) {
    if (!input.guestName || !input.guestEmail || !input.guestPhone) {
      throw AppError.badRequest('Guest name, email, and phone are required for guest bookings');
    }
  }

  const requestedDate = parseDateOnly(input.date);
  if (Number.isNaN(requestedDate.getTime())) {
    throw AppError.badRequest('Invalid date');
  }

  const today = startOfToday();
  if (requestedDate < today) {
    throw AppError.badRequest('Cannot book a date in the past');
  }

  const bookable = await availabilityService.isSlotBookable(requestedDate, input.startTime);
  if (!bookable) {
    throw AppError.conflict('This time slot is no longer available. Please choose another.');
  }

  // Derive endTime from the matching weekly slot definition so it's
  // never trusted blindly from the client.
  const weeklySlot = await prisma.availabilitySlot.findFirst({
    where: {
      isEnabled: true,
      startTime: input.startTime,
      dayOfWeek: dayOfWeekFromDate(requestedDate),
    },
  });
  if (!weeklySlot) {
    throw AppError.conflict('This time slot is no longer available. Please choose another.');
  }

  const created = await prisma.appointment.create({
    data: {
      patientId,
      guestName: patientId ? null : input.guestName,
      guestEmail: patientId ? null : input.guestEmail,
      guestPhone: patientId ? null : input.guestPhone,
      service: input.service,
      date: requestedDate,
      startTime: input.startTime,
      endTime: weeklySlot.endTime,
      mode: input.mode,
      status: 'pending',
      notes: input.notes || undefined,
    },
    include: APPOINTMENT_INCLUDE,
  });

  const dto = toAppointmentDTO(created);

  // Resolve the email address for the booking confirmation:
  // - Logged-in patient → fetch from their user record
  // - Guest → guestEmail field captured at booking time
  let patientEmail: string | null = null;
  if (patientId) {
    const user = await prisma.user.findFirst({
      where: { patient: { id: patientId } },
      select: { email: true },
    });
    patientEmail = user?.email ?? null;
  } else {
    patientEmail = input.guestEmail ?? null;
  }

  await notificationService.notifyAppointmentBooked({
    appointmentId: dto.id,
    patientName: dto.patientName,
    patientEmail,
    therapistName: THERAPIST_NAME,
    service: dto.service,
    dateLabel: dto.date,
    time: dto.time,
  });

  return dto;
}

async function getOwnPatientId(userId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    throw AppError.notFound('Patient profile not found');
  }
  return patient.id;
}

async function listMine(userId: string): Promise<AppointmentDTO[]> {
  const patientId = await getOwnPatientId(userId);
  const records = await prisma.appointment.findMany({
    where: { patientId },
    include: APPOINTMENT_INCLUDE,
    orderBy: { date: 'desc' },
  });
  return records.map(toAppointmentDTO);
}

async function getOwnedAppointmentOrThrow(
  appointmentId: string,
  patientId: string,
): Promise<AppointmentWithPatient> {
  const record = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: APPOINTMENT_INCLUDE,
  });
  if (!record || record.patientId !== patientId) {
    throw AppError.notFound('Appointment not found');
  }
  return record;
}

async function cancelMine(
  userId: string,
  appointmentId: string,
  reason?: string,
): Promise<AppointmentDTO> {
  const patientId = await getOwnPatientId(userId);
  const record = await getOwnedAppointmentOrThrow(appointmentId, patientId);

  if (record.status === 'cancelled' || record.status === 'completed') {
    throw AppError.badRequest(`Cannot cancel an appointment that is already ${record.status}`);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'cancelled', cancellationReason: reason },
    include: APPOINTMENT_INCLUDE,
  });

  const dto = toAppointmentDTO(updated);
  if (updated.patient) {
    await notificationService.notifyAppointmentCancelled({
      appointmentId: dto.id,
      recipientUserId: updated.patient.userId,
      service: dto.service,
      dateLabel: dto.date,
      time: dto.time,
      reason,
    });
  }

  return dto;
}

/**
 * Patient-initiated reschedule. Re-validates the new slot the same
 * way `book` does, then moves the existing row to the new date/time
 * and resets status to pending so the admin re-approves it — matches
 * "patient can request reschedule / reschedule if rules allow" from
 * the spec without inventing a separate approval-request model.
 */
async function rescheduleMine(
  userId: string,
  appointmentId: string,
  input: RescheduleAppointmentInput,
): Promise<AppointmentDTO> {
  const patientId = await getOwnPatientId(userId);
  const record = await getOwnedAppointmentOrThrow(appointmentId, patientId);

  if (record.status === 'cancelled' || record.status === 'completed') {
    throw AppError.badRequest(`Cannot reschedule an appointment that is already ${record.status}`);
  }

  return rescheduleInternal(record, input);
}

async function rescheduleInternal(
  record: AppointmentWithPatient,
  input: RescheduleAppointmentInput,
): Promise<AppointmentDTO> {
  const requestedDate = parseDateOnly(input.date);
  if (Number.isNaN(requestedDate.getTime())) {
    throw AppError.badRequest('Invalid date');
  }

  const today = startOfToday();
  if (requestedDate < today) {
    throw AppError.badRequest('Cannot reschedule to a date in the past');
  }

  const bookable = await availabilityService.isSlotBookable(requestedDate, input.startTime);
  if (!bookable) {
    throw AppError.conflict('This time slot is no longer available. Please choose another.');
  }

  const weeklySlot = await prisma.availabilitySlot.findFirst({
    where: {
      isEnabled: true,
      startTime: input.startTime,
      dayOfWeek: dayOfWeekFromDate(requestedDate),
    },
  });
  if (!weeklySlot) {
    throw AppError.conflict('This time slot is no longer available. Please choose another.');
  }

  const updated = await prisma.appointment.update({
    where: { id: record.id },
    data: {
      date: requestedDate,
      startTime: input.startTime,
      endTime: weeklySlot.endTime,
      status: 'pending',
    },
    include: APPOINTMENT_INCLUDE,
  });

  const dto = toAppointmentDTO(updated);
  if (updated.patient) {
    await notificationService.notifyAppointmentRescheduled({
      appointmentId: dto.id,
      recipientUserId: updated.patient.userId,
      service: dto.service,
      dateLabel: dto.date,
      time: dto.time,
    });
  }

  return dto;
}

// ---------------- Admin-side ----------------

async function listAllForAdmin(status?: AppointmentStatus): Promise<AppointmentDTO[]> {
  const records = await prisma.appointment.findMany({
    where: status ? { status } : undefined,
    include: APPOINTMENT_INCLUDE,
    orderBy: { date: 'desc' },
  });
  return records.map(toAppointmentDTO);
}

async function getAnyOrThrow(appointmentId: string): Promise<AppointmentWithPatient> {
  const record = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: APPOINTMENT_INCLUDE,
  });
  if (!record) {
    throw AppError.notFound('Appointment not found');
  }
  return record;
}

async function confirmForAdmin(appointmentId: string): Promise<AppointmentDTO> {
  const record = await getAnyOrThrow(appointmentId);
  if (record.status !== 'pending') {
    throw AppError.badRequest(`Cannot confirm an appointment that is already ${record.status}`);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'upcoming' },
    include: APPOINTMENT_INCLUDE,
  });
  const dto = toAppointmentDTO(updated);
  if (updated.patient) {
    await notificationService.notifyAppointmentConfirmed({
      appointmentId: dto.id,
      recipientUserId: updated.patient.userId,
      therapistName: THERAPIST_NAME,
      service: dto.service,
      dateLabel: dto.date,
      time: dto.time,
    });
  }
  return dto;
}

async function completeForAdmin(appointmentId: string): Promise<AppointmentDTO> {
  const record = await getAnyOrThrow(appointmentId);
  if (record.status !== 'upcoming') {
    throw AppError.badRequest(
      `Cannot mark an appointment as completed unless it is upcoming (current status: ${record.status})`,
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'completed' },
    include: APPOINTMENT_INCLUDE,
  });
  return toAppointmentDTO(updated);
}

async function cancelForAdmin(appointmentId: string, reason?: string): Promise<AppointmentDTO> {
  const record = await getAnyOrThrow(appointmentId);
  if (record.status === 'cancelled' || record.status === 'completed') {
    throw AppError.badRequest(`Cannot cancel an appointment that is already ${record.status}`);
  }

  const wasRejection = record.status === 'pending';

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'cancelled', cancellationReason: reason },
    include: APPOINTMENT_INCLUDE,
  });
  const dto = toAppointmentDTO(updated);
  if (updated.patient) {
    if (wasRejection) {
      await notificationService.notifyAppointmentRejected({
        appointmentId: dto.id,
        recipientUserId: updated.patient.userId,
        therapistName: THERAPIST_NAME,
        service: dto.service,
        dateLabel: dto.date,
        time: dto.time,
        reason,
      });
    } else {
      await notificationService.notifyAppointmentCancelled({
        appointmentId: dto.id,
        recipientUserId: updated.patient.userId,
        service: dto.service,
        dateLabel: dto.date,
        time: dto.time,
        reason,
      });
    }
  }
  return dto;
}

async function rescheduleForAdmin(
  appointmentId: string,
  input: RescheduleAppointmentInput,
): Promise<AppointmentDTO> {
  const record = await getAnyOrThrow(appointmentId);
  if (record.status === 'cancelled' || record.status === 'completed') {
    throw AppError.badRequest(`Cannot reschedule an appointment that is already ${record.status}`);
  }
  return rescheduleInternal(record, input);
}

export const appointmentService = {
  book,
  listMine,
  cancelMine,
  rescheduleMine,
  listAllForAdmin,
  confirmForAdmin,
  completeForAdmin,
  cancelForAdmin,
  rescheduleForAdmin,
};
