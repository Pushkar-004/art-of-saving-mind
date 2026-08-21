import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';
import { validate } from '@/middleware/validate';
import { psychologistController } from './psychologist.controller';
import { createPsychologistSchema, psychologistIdParamSchema, updatePsychologistStatusSchema } from './psychologist.validation';

const router = Router();
router.use(authenticate, authorize(Role.admin));
router.get('/', psychologistController.list);
router.post('/', validate(createPsychologistSchema), psychologistController.create);
router.patch('/:id/status', validate(updatePsychologistStatusSchema), psychologistController.setActive);
router.get('/:id', validate(psychologistIdParamSchema), psychologistController.list);
export default router;
