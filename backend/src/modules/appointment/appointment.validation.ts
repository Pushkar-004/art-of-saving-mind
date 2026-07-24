import { z } from 'zod';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const dateString = z.string().trim().regex(DATE_REGEX, 'Date must be in YYYY-MM-DD format');
const timeString = z.string().trim().regex(TIME_REGEX, 'Time must be in HH:mm format');

// Matches the fixed `services` list on the public booking page
// (app/appointment-booking/page.tsx) — kept as free-text rather than
// an enum so admin/patient-side code that already stores service
// names as plain strings (mock-data/appointments.ts) needs no change,
// and so adding a new service later doesn't require a migration.
const serviceName = z.string().trim().min(2).max(120);

const mode = z.enum(['online', 'offline']);

// POST /api/appointments/book — works for BOTH guest and logged-in
// patient bookings. Guest contact fields are required only when there
// is no authenticated patient making the call; the controller fills
// in patientId itself when req.user is present, so the body never
// needs to send it.
export const bookAppointmentSchema = z.object({
  body: z
    .object({
      service: serviceName,
      date: dateString,
      startTime: timeString,
      mode,
      notes: z.string().trim().max(1000).optional().or(z.literal('')),
      // Guest-only fields — validated conditionally below.
      guestName: z.string().trim().min(2).optional(),
      guestEmail: z.string().trim().toLowerCase().email().optional(),
      guestPhone: z.string().trim().min(7).max(20).optional(),
    })
    .superRefine((data, ctx) => {
      // The controller decides guest-vs-patient based on req.user, but
      // we still validate guest fields together here so a malformed
      // guest submission fails fast with a clear message rather than
      // silently creating a name-less appointment.
      const hasAnyGuestField = data.guestName || data.guestEmail || data.guestPhone;
      if (hasAnyGuestField && !(data.guestName && data.guestEmail && data.guestPhone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'guestName, guestEmail, and guestPhone are all required together',
          path: ['guestName'],
        });
      }
    }),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>['body'];

// POST /api/appointments/:id/cancel — patient cancelling their own,
// or admin cancelling any. reason is optional either way.
export const cancelAppointmentSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid appointment id') }),
  body: z.object({
    reason: z.string().trim().max(500).optional(),
  }),
});

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>['body'];

// POST /api/appointments/:id/reschedule — new date/time for an
// existing appointment. Used by both the patient ("request
// reschedule") and admin ("reschedule booking") flows.
export const rescheduleAppointmentSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid appointment id') }),
  body: z.object({
    date: dateString,
    startTime: timeString,
  }),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>['body'];

// POST /api/appointments/:id/confirm — admin approves a pending booking.
export const appointmentIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid appointment id') }),
});

// GET /api/appointments/admin?status=pending — optional status filter.
export const listAppointmentsQuerySchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'upcoming', 'completed', 'cancelled']).optional(),
  }),
});
