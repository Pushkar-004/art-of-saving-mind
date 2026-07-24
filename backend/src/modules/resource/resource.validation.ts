import { z } from 'zod';
import { ResourceCategory } from '@prisma/client';

const categoryEnum = z.nativeEnum(ResourceCategory);

// POST /api/resources (admin)
export const createResourceSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    description: z.string().trim().max(2000).optional(),
    category: categoryEnum,
    fileUrl: z
      .string()
      .trim()
      .min(1, 'File URL is required')
      .max(2048, 'File URL is too long'),
    fileName: z.string().trim().min(1, 'File name is required').max(255),
  }),
});

// PATCH /api/resources/:id (admin) — every field optional, but at
// least one must be present.
export const updateResourceSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid resource id') }),
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(2000).optional(),
      category: categoryEnum.optional(),
      fileUrl: z.string().trim().min(1).max(2048).optional(),
      fileName: z.string().trim().min(1).max(255).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

// DELETE /api/resources/:id (admin)
export const resourceIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid resource id') }),
});

// GET /api/resources, GET /api/resources/admin — shared search/filter
// query shape for both the patient library and the admin management
// table.
export const listResourcesQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().max(200).optional(),
    category: categoryEnum.optional(),
  }),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>['body'];
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>['body'];
export type ListResourcesQuery = z.infer<typeof listResourcesQuerySchema>['query'];
