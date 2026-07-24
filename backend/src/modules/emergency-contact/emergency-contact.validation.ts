import { z } from 'zod';

// Mirrors the EmergencyContact shape in the frontend
// (lib/mock-data/patients.ts): name, relationship, phone. email is
// included as optional since the schema supports it, even though the
// current admin-side display doesn't render it yet.
export const upsertEmergencyContactSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name is required'),
    relationship: z.string().trim().min(2, 'Relationship is required'),
    phone: z.string().trim().min(7, 'Phone number looks too short').max(20),
    email: z.string().trim().toLowerCase().email('Invalid email address').optional().or(z.literal('')),
  }),
});

export type UpsertEmergencyContactInput = z.infer<typeof upsertEmergencyContactSchema>['body'];
