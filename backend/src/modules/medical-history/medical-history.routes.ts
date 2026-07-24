import { Router } from 'express';
import { Role } from '@prisma/client';
import { medicalHistoryController } from '@/modules/medical-history/medical-history.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { upsertMedicalHistorySchema } from '@/modules/medical-history/medical-history.validation';

const router = Router();

// GET /api/medical-history/me
router.get('/me', authenticate, authorize(Role.patient), medicalHistoryController.getMine);

// PUT /api/medical-history/me — create-if-missing, update-if-exists.
router.put(
  '/me',
  authenticate,
  authorize(Role.patient),
  validate(upsertMedicalHistorySchema),
  medicalHistoryController.upsertMine,
);

// GET /api/medical-history/admin/:patientId — admin-only read.
router.get(
  '/admin/:patientId',
  authenticate,
  authorize(Role.admin),
  medicalHistoryController.getForAdmin,
);

export default router;
