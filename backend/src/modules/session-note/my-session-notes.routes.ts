import { Router } from 'express';
import { Role } from '@prisma/client';
import { sessionNoteController } from '@/modules/session-note/session-note.controller';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';

// Separate router (mounted directly at /api/my-session-notes in
// app.ts) rather than a sub-path under /api/session-notes — the
// spec calls for this exact top-level path for the patient-facing
// read, distinct from the admin-only /api/session-notes namespace.
const router = Router();

// GET /api/my-session-notes
router.get('/', authenticate, authorize(Role.patient), sessionNoteController.listMine);

export default router;
