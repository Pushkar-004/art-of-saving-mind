import { z } from 'zod';

// Mirrors the MedicalHistory shape already defined in the frontend
// (lib/mock-data/patients.ts): conditions/medications/allergies as
// arrays of plain strings — no nested objects, dosages, or dates,
// since nothing in the current UI collects that level of detail.
const stringArray = z.array(z.string().trim().min(1)).max(50);

// PUT /api/medical-history/me — full upsert. All three arrays are
// optional on the wire so a patient can update just one list; any
// array not provided is left untouched on update, or defaults to []
// on first create.
export const upsertMedicalHistorySchema = z.object({
  body: z
    .object({
      conditions: stringArray.optional(),
      medications: stringArray.optional(),
      allergies: stringArray.optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export type UpsertMedicalHistoryInput = z.infer<typeof upsertMedicalHistorySchema>['body'];
