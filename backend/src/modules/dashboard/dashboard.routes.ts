import { Router } from 'express';
import { Role } from '@prisma/client';
import { dashboardController } from '@/modules/dashboard/dashboard.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';

const router = Router();

// GET /api/dashboard/admin/analytics
router.get(
  '/admin/analytics',
  authenticate,
  authorize(Role.admin),
  dashboardController.adminAnalytics,
);

// GET /api/dashboard/patient/analytics
router.get(
  '/patient/analytics',
  authenticate,
  authorize(Role.patient),
  dashboardController.patientAnalytics,
);

export default router;
