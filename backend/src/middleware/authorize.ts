import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '@/utils/AppError';

// Must run AFTER authenticate() — relies on req.user being populated.
// Usage: router.get('/admin/x', authenticate, authorize('admin'), handler)
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Not authenticated'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(AppError.forbidden('You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
