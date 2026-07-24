import { z } from 'zod';

// PATCH /api/patient/me
// Fields mirror what app/dashboard/patient/settings/page.tsx actually
// collects: full name, email, phone. All optional on the wire — a
// patient can update just one field at a time — but at least one must
// be present, or there is nothing to do.
export const updatePatientProfileSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, 'Full name is required').optional(),
      email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
      phone: z
        .string()
        .trim()
        .min(7, 'Phone number looks too short')
        .max(20, 'Phone number looks too long')
        .optional()
        .or(z.literal('')),
      primaryConcern: z.string().trim().max(255).optional().or(z.literal('')),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export type UpdatePatientProfileInput = z.infer<typeof updatePatientProfileSchema>['body'];
