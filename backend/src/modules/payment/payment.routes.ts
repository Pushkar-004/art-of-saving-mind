import { Router } from 'express';
import { Role } from '@prisma/client';
import { paymentController } from '@/modules/payment/payment.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { uploadPaymentProof } from '@/middleware/uploadPaymentProof';
import {
  appointmentIdParamSchema,
  paymentIdParamSchema,
  verifyPaymentSchema,
  rejectPaymentSchema,
  updatePaymentSettingsSchema,
} from '@/modules/payment/payment.validation';

const router = Router();

// ─── Settings (public within authenticated context) ───────────────────────────

// GET /api/payments/settings — both roles
router.get('/settings', authenticate, paymentController.getSettings);

// PATCH /api/payments/settings — admin only
router.patch(
  '/settings',
  authenticate,
  authorize(Role.admin),
  validate(updatePaymentSettingsSchema),
  paymentController.updateSettings,
);

// ─── Admin ────────────────────────────────────────────────────────────────────

// GET /api/payments/admin — list all payments
router.get('/admin', authenticate, authorize(Role.admin), paymentController.listAll);

// POST /api/payments/admin/:paymentId/verify
router.post(
  '/admin/:paymentId/verify',
  authenticate,
  authorize(Role.admin),
  validate(verifyPaymentSchema),
  paymentController.verifyPayment,
);

// POST /api/payments/admin/:paymentId/reject
router.post(
  '/admin/:paymentId/reject',
  authenticate,
  authorize(Role.admin),
  validate(rejectPaymentSchema),
  paymentController.rejectPayment,
);

// ─── Patient ─────────────────────────────────────────────────────────────────

// GET /api/payments/appointment/:appointmentId — fetch/init payment for appointment
router.get(
  '/appointment/:appointmentId',
  authenticate,
  authorize(Role.patient),
  validate(appointmentIdParamSchema),
  paymentController.getPaymentForAppointment,
);

// POST /api/payments/appointment/:appointmentId/submit — multipart image upload
// multer runs first (parses multipart), then param validation
router.post(
  '/appointment/:appointmentId/submit',
  authenticate,
  authorize(Role.patient),
  uploadPaymentProof, // handles multipart/form-data, saves file
  validate(appointmentIdParamSchema), // validates params after multer
  paymentController.submitPayment,
);

export default router;
