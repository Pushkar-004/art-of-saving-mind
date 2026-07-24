import { Request, Response, NextFunction } from 'express';
import { patientService } from '@/modules/patient/patient.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

async function getMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const profile = await patientService.getMyProfile(req.user.id);
    sendSuccess(res, { profile }, 'Profile fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function updateMyProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const profile = await patientService.updateMyProfile(req.user.id, req.body);
    sendSuccess(res, { profile }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/patient/admin — admin-only list of all patients, replaces
// the frontend's mocked `patients` array on the admin patients page.
async function listPatientsForAdmin(_req: Request, res: Response, next: NextFunction) {
  try {
    const profiles = await patientService.listPatientsForAdmin();
    sendSuccess(res, { patients: profiles }, 'Patients fetched successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/patient/admin/:patientId — admin-only single patient read.
async function getPatientProfileForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await patientService.getPatientProfileForAdmin(req.params.patientId);
    sendSuccess(res, { profile }, 'Patient profile fetched successfully');
  } catch (err) {
    next(err);
  }
}

export const patientController = {
  getMyProfile,
  updateMyProfile,
  listPatientsForAdmin,
  getPatientProfileForAdmin,
};
