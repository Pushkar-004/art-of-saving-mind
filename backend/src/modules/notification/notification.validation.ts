import { z } from 'zod';

// GET /api/notifications?unreadOnly=true — optional filter so the
// frontend badge/poll can ask for just the unread count/list without
// pulling full history every cycle if it ever needs to.
export const listNotificationsQuerySchema = z.object({
  query: z.object({
    unreadOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  }),
});

// PATCH /api/notifications/:id/read
export const notificationIdParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid notification id') }),
});
