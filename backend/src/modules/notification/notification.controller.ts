import { Request, Response, NextFunction } from 'express';
import { notificationService } from '@/modules/notification/notification.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

// GET /api/notifications/unread-count
async function getUnreadCount(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const notifications = await notificationService.listMine(req.user.id, true);
    sendSuccess(res, { count: notifications.length }, 'Unread count fetched');
  } catch (err) {
    next(err);
  }
}

// GET /api/notifications — works for both patients and admins; each
// user only ever sees notifications addressed to their own user id.
async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const unreadOnly = (req.query as { unreadOnly?: boolean }).unreadOnly === true;
    const notifications = await notificationService.listMine(req.user.id, unreadOnly);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    sendSuccess(res, { notifications, unreadCount }, 'Notifications fetched successfully');
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/:id/read
async function markRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const notification = await notificationService.markRead(req.user.id, req.params.id);
    sendSuccess(res, { notification }, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
}

// PATCH /api/notifications/read-all
async function markAllRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const result = await notificationService.markAllRead(req.user.id);
    sendSuccess(res, result, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
}

export const notificationController = {
  getUnreadCount,
  listMine,
  markRead,
  markAllRead,
};
