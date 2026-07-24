import { Request, Response, NextFunction } from 'express';
import { reportService } from './report.service';
import { AppError } from '@/utils/AppError';

// GET /api/reports/patient/:patientId/pdf  (admin)
async function patientReportPDF(req: Request, res: Response, next: NextFunction) {
  try {
    await reportService.streamPatientReport(res, req.params.patientId);
  } catch (err) {
    next(err);
  }
}

// GET /api/reports/appointments/pdf  (admin)
async function appointmentsReportPDF(_req: Request, res: Response, next: NextFunction) {
  try {
    await reportService.streamAppointmentsReport(res);
  } catch (err) {
    next(err);
  }
}

// GET /api/reports/my-report/pdf  (patient)
async function myReportPDF(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    await reportService.streamMyReport(res, req.user.id);
  } catch (err) {
    next(err);
  }
}

export const reportController = {
  patientReportPDF,
  appointmentsReportPDF,
  myReportPDF,
};
