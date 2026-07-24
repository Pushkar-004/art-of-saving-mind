import { Router } from 'express';
import { aiController } from '@/modules/ai/ai.controller';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import { chatSchema } from '@/modules/ai/ai.validation';

const router = Router();

// POST /api/ai/chat — requires a logged-in user (the wellness
// assistant lives inside the authenticated patient dashboard). Not
// role-restricted to `patient` only, in case admin/staff also need
// to use it — there is nothing patient-specific in the request.
router.post('/chat', authenticate, validate(chatSchema), aiController.chat);

export default router;
