import { Router } from 'express';
import { Role } from '@prisma/client';
import { availabilityController } from '@/modules/availability/availability.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  createBlockedDateSchema,
  deleteBlockedDateSchema,
  replaceAvailabilitySchema,
} from '@/modules/availability/availability.validation';

const router = Router();

// GET /api/availability/slots — PUBLIC. Must be registered before the
// admin-only "/" routes below so it never collides with them.
router.get('/slots', availabilityController.getAvailableSlots);

// GET /api/availability — admin reads the raw weekly config to edit it.
router.get(
  '/',
  authenticate,
  authorize(Role.admin),
  availabilityController.getWeeklyAvailability,
);

// PUT /api/availability — admin-only full-week save.
router.put(
  '/',
  authenticate,
  authorize(Role.admin),
  validate(replaceAvailabilitySchema),
  availabilityController.replaceWeeklyAvailability,
);

// GET /api/availability/blocked-dates — admin-only.
router.get(
  '/blocked-dates',
  authenticate,
  authorize(Role.admin),
  availabilityController.listBlockedDates,
);

// POST /api/availability/blocked-dates — admin-only.
router.post(
  '/blocked-dates',
  authenticate,
  authorize(Role.admin),
  validate(createBlockedDateSchema),
  availabilityController.createBlockedDate,
);

// DELETE /api/availability/blocked-dates/:id — admin-only.
router.delete(
  '/blocked-dates/:id',
  authenticate,
  authorize(Role.admin),
  validate(deleteBlockedDateSchema),
  availabilityController.deleteBlockedDate,
);

export default router;
