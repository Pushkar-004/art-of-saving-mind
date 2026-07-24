import { Router } from 'express';
import { Role } from '@prisma/client';
import { sessionNoteController } from '@/modules/session-note/session-note.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import {
  createSessionNoteSchema,
  sessionNoteByAppointmentParamSchema,
  updateSessionNoteSchema,
} from '@/modules/session-note/session-note.validation';

const router = Router();

// ---------------- Admin ----------------

// POST /api/session-notes
router.post(
  '/',
  authenticate,
  authorize(Role.admin),
  validate(createSessionNoteSchema),
  sessionNoteController.create,
);

// PATCH /api/session-notes/:id
router.patch(
  '/:id',
  authenticate,
  authorize(Role.admin),
  validate(updateSessionNoteSchema),
  sessionNoteController.update,
);

// GET /api/session-notes/:appointmentId
router.get(
  '/:appointmentId',
  authenticate,
  authorize(Role.admin),
  validate(sessionNoteByAppointmentParamSchema),
  sessionNoteController.getByAppointmentId,
);

export default router;
