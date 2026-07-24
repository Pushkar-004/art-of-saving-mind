import { Appointment, Patient, SessionNote, User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { startOfToday } from '@/utils/date';
import { SessionNoteDTO, SessionNoteWithAppointmentDTO } from '@/modules/session-note/session-note.types';
import {
  CreateSessionNoteInput,
  UpdateSessionNoteInput,
} from '@/modules/session-note/session-note.validation';

// ---------------- Local formatting helpers ----------------
// Deliberately duplicated (not imported) from appointment.service.ts,
// which doesn't export them — every module in this codebase formats
// its own date/time presentation locally rather than reaching into
// another module's internals. Logic matches exactly so a note's
// "appointmentDate"/"appointmentTime" always agrees with what
// /api/appointments/me shows for the same row.

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

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

// ---------------- DTO mapping ----------------

type SessionNoteWithRelations = SessionNote & {
  therapist: User;
  patient: Patient & { user: User };
};

type SessionNoteWithAppointment = SessionNoteWithRelations & {
  appointment: Appointment;
};

function toSessionNoteDTO(record: SessionNoteWithRelations): SessionNoteDTO {
  return {
    id: record.id,
    appointmentId: record.appointmentId,
    therapistId: record.therapistId,
    therapistName: record.therapist.name,
    patientId: record.patientId,
    patientName: record.patient.user.name,
    diagnosisSummary: record.diagnosisSummary,
    observations: record.observations,
    recommendations: record.recommendations,
    homework: record.homework,
    nextGoals: record.nextGoals,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function toSessionNoteWithAppointmentDTO(
  record: SessionNoteWithAppointment,
): SessionNoteWithAppointmentDTO {
  return {
    ...toSessionNoteDTO(record),
    appointmentService: record.appointment.service,
    appointmentDate: formatDateLabel(record.appointment.date),
    appointmentTime: formatTime(record.appointment.startTime),
  };
}

const NOTE_INCLUDE = {
  therapist: true,
  patient: { include: { user: true } },
} as const;

const NOTE_WITH_APPOINTMENT_INCLUDE = {
  therapist: true,
  patient: { include: { user: true } },
  appointment: true,
} as const;

// ---------------- Shared lookups ----------------

/**
 * Loads the target appointment and enforces the one rule shared by
 * both create and update: a session note can only be written once the
 * appointment is COMPLETED, and only for an appointment linked to a
 * real patient (guest bookings have no Patient row to attach a note
 * to). Centralized here so both admin entry points apply the same
 * check rather than duplicating it.
 */
async function getCompletedAppointmentOrThrow(appointmentId: string): Promise<Appointment> {
  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) {
    throw AppError.notFound('Appointment not found');
  }
  if (appointment.status !== 'completed') {
    throw AppError.badRequest(
      'Session notes can only be created or updated for completed appointments',
    );
  }
  if (!appointment.patientId) {
    throw AppError.badRequest('Cannot add session notes to a guest appointment');
  }
  return appointment;
}

async function getNoteByIdOrThrow(id: string): Promise<SessionNoteWithRelations> {
  const record = await prisma.sessionNote.findUnique({ where: { id }, include: NOTE_INCLUDE });
  if (!record) {
    throw AppError.notFound('Session note not found');
  }
  return record;
}

// ---------------- Admin ----------------

/**
 * Creates the note for an appointment. The appointment must already
 * be completed (checked above) and must not already have a note —
 * the 1:1 relation means a second create attempt should fail with a
 * clear conflict rather than a raw unique-constraint database error.
 */
async function createForAdmin(
  therapistId: string,
  input: CreateSessionNoteInput,
): Promise<SessionNoteDTO> {
  const appointment = await getCompletedAppointmentOrThrow(input.appointmentId);

  const existing = await prisma.sessionNote.findUnique({
    where: { appointmentId: input.appointmentId },
  });
  if (existing) {
    throw AppError.conflict('This appointment already has session notes. Use update instead.');
  }

  const record = await prisma.sessionNote.create({
    data: {
      appointmentId: appointment.id,
      therapistId,
      // appointment.patientId is guaranteed non-null by
      // getCompletedAppointmentOrThrow above.
      patientId: appointment.patientId as string,
      diagnosisSummary: input.diagnosisSummary ?? null,
      observations: input.observations ?? null,
      recommendations: input.recommendations ?? null,
      homework: input.homework ?? null,
      nextGoals: input.nextGoals ?? null,
    },
    include: NOTE_INCLUDE,
  });

  return toSessionNoteDTO(record);
}

/**
 * Updates an existing note. Re-validates that the underlying
 * appointment is still completed — matches "Admins can create/update
 * only after appointment status is COMPLETED" applying to both verbs,
 * not just creation.
 */
async function updateForAdmin(
  id: string,
  input: UpdateSessionNoteInput,
): Promise<SessionNoteDTO> {
  const existing = await getNoteByIdOrThrow(id);
  await getCompletedAppointmentOrThrow(existing.appointmentId);

  const record = await prisma.sessionNote.update({
    where: { id },
    data: {
      ...(input.diagnosisSummary !== undefined ? { diagnosisSummary: input.diagnosisSummary } : {}),
      ...(input.observations !== undefined ? { observations: input.observations } : {}),
      ...(input.recommendations !== undefined ? { recommendations: input.recommendations } : {}),
      ...(input.homework !== undefined ? { homework: input.homework } : {}),
      ...(input.nextGoals !== undefined ? { nextGoals: input.nextGoals } : {}),
    },
    include: NOTE_INCLUDE,
  });

  return toSessionNoteDTO(record);
}

/**
 * Admin lookup by appointment id — what the admin UI has on hand when
 * opening the "Session Notes" modal from the appointments list.
 * Returns null (not a 404) when no note exists yet, so the frontend
 * can distinguish "nothing written yet, show an empty form" from a
 * genuine error.
 */
async function getByAppointmentIdForAdmin(appointmentId: string): Promise<SessionNoteDTO | null> {
  const record = await prisma.sessionNote.findUnique({
    where: { appointmentId },
    include: NOTE_INCLUDE,
  });
  return record ? toSessionNoteDTO(record) : null;
}

// ---------------- Patient ----------------

async function resolvePatientId(userId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    throw AppError.notFound('Patient profile not found');
  }
  return patient.id;
}

/**
 * Patient's own notes across all of their completed sessions, newest
 * first — powers both the dedicated session-notes page and the
 * dashboard's "latest recommendation" card (which just takes the
 * first item of this list).
 */
async function listMine(userId: string): Promise<SessionNoteWithAppointmentDTO[]> {
  const patientId = await resolvePatientId(userId);
  const records = await prisma.sessionNote.findMany({
    where: { patientId },
    include: NOTE_WITH_APPOINTMENT_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  return records.map(toSessionNoteWithAppointmentDTO);
}

export const sessionNoteService = {
  createForAdmin,
  updateForAdmin,
  getByAppointmentIdForAdmin,
  listMine,
};
