import { z } from 'zod';

export const createPsychologistSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    phone: z.string().trim().min(7).max(20).optional(),
    password: z.string().min(8).max(128),
  }),
});

export const psychologistIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid psychologist id') }),
});

export const updatePsychologistStatusSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid psychologist id') }),
  body: z.object({ isActive: z.boolean() }),
});

export type CreatePsychologistInput = z.infer<typeof createPsychologistSchema>['body'];
