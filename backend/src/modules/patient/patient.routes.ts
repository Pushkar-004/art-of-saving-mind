import { Router } from 'express';
import { Role } from '@prisma/client';
import { patientController } from '@/modules/patient/patient.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { updatePatientProfileSchema } from '@/modules/patient/patient.validation';

const router = Router();

// GET /api/patient/me — current patient's own profile.
router.get('/me', authenticate, authorize(Role.patient), patientController.getMyProfile);

// PATCH /api/patient/me — current patient updates their own profile only.
router.patch(
  '/me',
  authenticate,
  authorize(Role.patient),
  validate(updatePatientProfileSchema),
  patientController.updateMyProfile,
);

// GET /api/patient/admin — admin-only list of all patients.
router.get(
  '/admin',
  authenticate,
  authorize(Role.admin),
  patientController.listPatientsForAdmin,
);

// GET /api/patient/admin/:patientId — admin-only single patient read.
router.get(
  '/admin/:patientId',
  authenticate,
  authorize(Role.admin),
  patientController.getPatientProfileForAdmin,
);

export default router;
