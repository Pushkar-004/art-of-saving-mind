import { Router } from 'express';
import { Role } from '@prisma/client';
import { resourceController } from '@/modules/resource/resource.controller';
import { authenticate } from '@/middleware/authenticate';
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

// ---------------- Patient ----------------

// GET /api/resources?search=&category=
router.get(
  '/',
  authenticate,
  authorize(Role.patient),
  validate(listResourcesQuerySchema),
  resourceController.listForPatient,
);

// GET /api/resources/:id
router.get(
  '/:id',
  authenticate,
  authorize(Role.patient),
  validate(resourceIdParamSchema),
  resourceController.getById,
);

export default router;
