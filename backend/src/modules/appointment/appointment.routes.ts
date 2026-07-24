import { Router } from 'express';
import { Role } from '@prisma/client';
import { appointmentController } from '@/modules/appointment/appointment.controller';
import { authenticate, optionalAuthenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  appointmentIdParamSchema,
  bookAppointmentSchema,
  cancelAppointmentSchema,
  listAppointmentsQuerySchema,
  rescheduleAppointmentSchema,
} from '@/modules/appointment/appointment.validation';

const router = Router();

// POST /api/appointments/book — PUBLIC. Powers both the public guest
// booking page and the logged-in patient "new appointment" flow.
// optionalAuthenticate lets a logged-in patient's token attach
// patientId automatically without requiring auth for guests.
router.post(
  '/book',
  optionalAuthenticate,
  validate(bookAppointmentSchema),
  appointmentController.book,
);

// GET /api/appointments/me — patient's own appointment history.
router.get('/me', authenticate, authorize(Role.patient), appointmentController.listMine);

// POST /api/appointments/:id/cancel — patient cancels their own.
router.post(
  '/:id/cancel',
  authenticate,
  authorize(Role.patient),
  validate(cancelAppointmentSchema),
  appointmentController.cancelMine,
);

// POST /api/appointments/:id/reschedule — patient reschedules their own.
router.post(
  '/:id/reschedule',
  authenticate,
  authorize(Role.patient),
  validate(rescheduleAppointmentSchema),
  appointmentController.rescheduleMine,
);

// ---------------- Admin-side ----------------

// GET /api/appointments/admin?status=pending
router.get(
  '/admin',
  authenticate,
  authorize(Role.admin),
  validate(listAppointmentsQuerySchema),
  appointmentController.listAllForAdmin,
);

// POST /api/appointments/admin/:id/confirm
router.post(
  '/admin/:id/confirm',
  authenticate,
  authorize(Role.admin),
  validate(appointmentIdParamSchema),
  appointmentController.confirmForAdmin,
);

// POST /api/appointments/admin/:id/complete
router.post(
  '/admin/:id/complete',
  authenticate,
  authorize(Role.admin),
  validate(appointmentIdParamSchema),
  appointmentController.completeForAdmin,
);

// POST /api/appointments/admin/:id/cancel
router.post(
  '/admin/:id/cancel',
  authenticate,
  authorize(Role.admin),
  validate(cancelAppointmentSchema),
  appointmentController.cancelForAdmin,
);

// POST /api/appointments/admin/:id/reschedule
router.post(
  '/admin/:id/reschedule',
  authenticate,
  authorize(Role.admin),
  validate(rescheduleAppointmentSchema),
  appointmentController.rescheduleForAdmin,
);

export default router;
