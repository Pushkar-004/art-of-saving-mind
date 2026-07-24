import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '@/modules/dashboard/dashboard.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

// GET /api/dashboard/admin/analytics
async function adminAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const analytics = await dashboardService.getAdminAnalytics();
    sendSuccess(res, { analytics }, 'Admin analytics fetched successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/dashboard/patient/analytics
async function patientAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const analytics = await dashboardService.getPatientAnalytics(req.user.id);
    sendSuccess(res, { analytics }, 'Patient analytics fetched successfully');
  } catch (err) {
    next(err);
  }
}

export const dashboardController = {
  adminAnalytics,
  patientAnalytics,
};
