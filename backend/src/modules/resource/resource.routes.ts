import { Router } from 'express';
import { Role } from '@prisma/client';
import { resourceController } from '@/modules/resource/resource.controller';
import { authenticate, optionalAuthenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  createResourceSchema,
  listResourcesQuerySchema,
  resourceIdParamSchema,
  updateResourceSchema,
} from '@/modules/resource/resource.validation';

const router = Router();

// ---------------- Admin ----------------

// GET /api/resources/admin?search=&category= — registered BEFORE the
// patient-side GET /:id route below, otherwise Express would match
// "admin" as the :id param instead of this literal path.
router.get(
  '/admin',
  authenticate,
  authorize(Role.admin),
  validate(listResourcesQuerySchema),
  resourceController.listForAdmin,
);

// POST /api/resources
router.post(
  '/',
  authenticate,
  authorize(Role.admin),
  validate(createResourceSchema),
  resourceController.create,
);

// PATCH /api/resources/:id
router.patch(
  '/:id',
  authenticate,
  authorize(Role.admin),
  validate(updateResourceSchema),
  resourceController.update,
);

// DELETE /api/resources/:id
router.delete(
  '/:id',
  authenticate,
  authorize(Role.admin),
  validate(resourceIdParamSchema),
  resourceController.remove,
);

// ---------------- Shared library (public site + patient dashboard) ----------------
//
// This listing is intentionally NOT gated behind authenticate+authorize.
// It backs two different consumers that both need read access to the
// same published resource library:
//   1. The public marketing site's Resources page (no logged-in user
//      at all — anonymous visitors).
//   2. The patient dashboard's Resources page (logged-in patients).
// `optionalAuthenticate` decodes a bearer token when one is present
// (so req.user is available for future per-user personalization) but
// never rejects the request when it's absent, which is what makes it
// safe for anonymous access. Using a single endpoint for both callers
// also avoids maintaining two near-identical "list resources" routes.
// Previously this was locked to `authorize(Role.patient)`, which is
// what caused the public Resources page (which is never authenticated)
// and any non-patient role to receive 401s instead of data.

// GET /api/resources?search=&category=
router.get(
  '/',
  optionalAuthenticate,
  validate(listResourcesQuerySchema),
  resourceController.listForPatient,
);

// GET /api/resources/:id
router.get(
  '/:id',
  optionalAuthenticate,
  validate(resourceIdParamSchema),
  resourceController.getById,
);

export default router;
