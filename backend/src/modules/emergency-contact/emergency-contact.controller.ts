import { Request, Response, NextFunction } from 'express';
import { emergencyContactService } from '@/modules/emergency-contact/emergency-contact.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

async function getMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const emergencyContact = await emergencyContactService.getMine(req.user.id);
    sendSuccess(res, { emergencyContact }, 'Emergency contact fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function upsertMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const emergencyContact = await emergencyContactService.upsertMine(req.user.id, req.body);
    sendSuccess(res, { emergencyContact }, 'Emergency contact saved successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/emergency-contact/admin/:patientId
async function getForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const emergencyContact = await emergencyContactService.getForAdmin(req.params.patientId);
    sendSuccess(res, { emergencyContact }, 'Emergency contact fetched successfully');
  } catch (err) {
    next(err);
  }
}

export const emergencyContactController = {
  getMine,
  upsertMine,
  getForAdmin,
};
