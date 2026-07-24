import { z } from 'zod';

const HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const timeString = z
  .string()
  .trim()
  .regex(HHMM_REGEX, 'Time must be in HH:mm format (e.g. "09:00")');

const dayOfWeek = z.enum([
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]);

// A single weekly recurring slot, as managed on the admin availability
// page. id is optional — present when editing an existing slot,
// absent when the admin adds a brand new one in the same save.
const slotInput = z
  .object({
    id: z.string().uuid().optional(),
    dayOfWeek,
    startTime: timeString,
    endTime: timeString,
    isEnabled: z.boolean().default(true),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'Start time must be before end time',
    path: ['endTime'],
  });

// PUT /api/availability — full replace-style save. The admin
// availability page edits the whole week at once and clicks one
// "Save Changes" button, so the simplest, most predictable contract
// is "send the complete desired slot list, server reconciles it" —
// matching how the page already collects all edits into local state
// before saving.
export const replaceAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(slotInput).max(200),
  }),
});

export type ReplaceAvailabilityInput = z.infer<typeof replaceAvailabilitySchema>['body'];

// POST /api/availability/blocked-dates
export const createBlockedDateSchema = z.object({
  body: z.object({
    date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    label: z.string().trim().max(255).optional(),
  }),
});

export type CreateBlockedDateInput = z.infer<typeof createBlockedDateSchema>['body'];

// DELETE /api/availability/blocked-dates/:id
export const deleteBlockedDateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid blocked date id'),
  }),
});
