import { z } from 'zod';

// All clinical fields are optional free text — a therapist may only
// want to fill in part of the note at first and complete it later via
// PATCH. Matches the "every field optional, but at least one must be
// present" convention from resource.validation.ts / medical-history.validation.ts.
const diagnosisSummary = z.string().trim().max(4000);
const observations = z.string().trim().max(4000);
const recommendations = z.string().trim().max(4000);
const homework = z.string().trim().max(4000);
const nextGoals = z.string().trim().max(4000);

// POST /api/session-notes (admin) — appointmentId identifies which
// completed appointment this note belongs to. therapistId/patientId
// are NOT accepted from the client: the controller derives
// therapistId from req.user, and the service derives patientId from
// the appointment itself, so a caller can never write a note that
// claims to belong to someone else's session.
export const createSessionNoteSchema = z.object({
  body: z.object({
    appointmentId: z.string().uuid('Invalid appointment id'),
    diagnosisSummary: diagnosisSummary.optional(),
    observations: observations.optional(),
    recommendations: recommendations.optional(),
    homework: homework.optional(),
    nextGoals: nextGoals.optional(),
  }),
});

export type CreateSessionNoteInput = z.infer<typeof createSessionNoteSchema>['body'];

// PATCH /api/session-notes/:id (admin) — every clinical field
// optional, but at least one must be provided.
export const updateSessionNoteSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid session note id') }),
  body: z
    .object({
      diagnosisSummary: diagnosisSummary.optional(),
      observations: observations.optional(),
      recommendations: recommendations.optional(),
      homework: homework.optional(),
      nextGoals: nextGoals.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export type UpdateSessionNoteInput = z.infer<typeof updateSessionNoteSchema>['body'];

// GET /api/session-notes/:appointmentId (admin) — looks the note up
// by the appointment it belongs to, not by SessionNote.id, since
// that's what the admin UI has on hand when opening the modal from
// the appointments list.
export const sessionNoteByAppointmentParamSchema = z.object({
  params: z.object({ appointmentId: z.string().uuid('Invalid appointment id') }),
});
