import { Router } from 'express';
import { notificationController } from '@/modules/notification/notification.controller';
import { authenticate } from '@/middleware/authenticate';
import { validate } from '@/middleware/validate';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from '@/modules/notification/notification.validation';

const router = Router();

// All notification routes require auth — every user (patient or
// admin) only ever reads/mutates their own notifications, scoped by
// req.user.id inside the controller/service.

// GET /api/notifications
router.get(
  '/',
  authenticate,
  validate(listNotificationsQuerySchema),
  notificationController.listMine,
);

// GET /api/notifications/unread-count — registered before /:id routes
// so the literal segment is not swallowed by a param.
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// PATCH /api/notifications/read-all — registered BEFORE the
// /:id/read route so the literal "read-all" path isn't swallowed by
// the param route below.
router.patch('/read-all', authenticate, notificationController.markAllRead);

// PATCH /api/notifications/:id/read
router.patch(
  '/:id/read',
  authenticate,
  validate(notificationIdParamSchema),
  notificationController.markRead,
);

export default router;
