import { Router } from 'express';
import { Role } from '@prisma/client';
import { emergencyContactController } from '@/modules/emergency-contact/emergency-contact.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { upsertEmergencyContactSchema } from '@/modules/emergency-contact/emergency-contact.validation';

const router = Router();

// GET /api/emergency-contact/me
router.get('/me', authenticate, authorize(Role.patient), emergencyContactController.getMine);

// PUT /api/emergency-contact/me — create-if-missing, update-if-exists.
router.put(
  '/me',
  authenticate,
  authorize(Role.patient),
  validate(upsertEmergencyContactSchema),
  emergencyContactController.upsertMine,
);

// GET /api/emergency-contact/admin/:patientId — admin-only read.
router.get(
  '/admin/:patientId',
  authenticate,
  authorize(Role.admin),
  emergencyContactController.getForAdmin,
);

export default router;
