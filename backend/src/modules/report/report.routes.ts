import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { reportController } from './report.controller';

const router = Router();

// ─── Admin ────────────────────────────────────────────────────────

// GET /api/reports/patient/:patientId/pdf
router.get(
  '/patient/:patientId/pdf',
  authenticate,
  authorize(Role.admin),
  reportController.patientReportPDF,
);

// GET /api/reports/appointments/pdf
router.get(
  '/appointments/pdf',
  authenticate,
  authorize(Role.admin),
  reportController.appointmentsReportPDF,
);

// ─── Patient ──────────────────────────────────────────────────────

// GET /api/reports/my-report/pdf
router.get(
  '/my-report/pdf',
  authenticate,
  authorize(Role.patient),
  reportController.myReportPDF,
);

export default router;
