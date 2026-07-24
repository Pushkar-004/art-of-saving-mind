import { Request, Response, NextFunction } from 'express';
import { medicalHistoryService } from '@/modules/medical-history/medical-history.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

async function getMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const medicalHistory = await medicalHistoryService.getMine(req.user.id);
    sendSuccess(res, { medicalHistory }, 'Medical history fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function upsertMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const medicalHistory = await medicalHistoryService.upsertMine(req.user.id, req.body);
    sendSuccess(res, { medicalHistory }, 'Medical history saved successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/medical-history/admin/:patientId
async function getForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const medicalHistory = await medicalHistoryService.getForAdmin(req.params.patientId);
    sendSuccess(res, { medicalHistory }, 'Medical history fetched successfully');
  } catch (err) {
    next(err);
  }
}

export const medicalHistoryController = {
  getMine,
  upsertMine,
  getForAdmin,
};
