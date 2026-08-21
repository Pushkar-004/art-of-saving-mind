import { Request, Response, NextFunction } from 'express';
import { AppointmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { appointmentService } from '@/modules/appointment/appointment.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

// POST /api/appointments/book — PUBLIC route, but also used by
// logged-in patients. `authenticate` is NOT applied to this route, so
// req.user is only present if the client happened to send a valid
// access token anyway (e.g. a logged-in patient using the public
// booking flow) — we check for it manually rather than gating the
// whole route behind auth.
async function book(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const patientId = await resolvePatientIdIfAny(req.user.id);
    if (!patientId) throw AppError.notFound('Patient profile not found');
    const appointment = await appointmentService.book(req.body, patientId);
    sendSuccess(res, { appointment }, 'Appointment booked successfully', 201);
  } catch (err) {
    next(err);
  }
}

// Helper used only by the controller — if a request happens to carry
// a valid patient access token, link the booking to that patient
// instead of treating it as a guest. Admin tokens are ignored here
// (an admin booking on someone's behalf isn't a supported flow yet).
async function resolvePatientIdIfAny(userId: string): Promise<string | null> {
  const patient = await prisma.patient.findUnique({ where: { userId } });
  return patient?.id ?? null;
}

async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const appointments = await appointmentService.listMine(req.user.id);
    sendSuccess(res, { appointments }, 'Appointments fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function cancelMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const appointment = await appointmentService.cancelMine(
      req.user.id,
      req.params.id,
      req.body.reason,
    );
    sendSuccess(res, { appointment }, 'Appointment cancelled successfully');
  } catch (err) {
    next(err);
  }
}

async function rescheduleMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const appointment = await appointmentService.rescheduleMine(
      req.user.id,
      req.params.id,
      req.body,
    );
    sendSuccess(res, { appointment }, 'Appointment rescheduled successfully');
  } catch (err) {
    next(err);
  }
}

// ---------------- Admin-side ----------------

async function listAllForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as AppointmentStatus | undefined;
    const appointments = await appointmentService.listAllForAdmin(status);
    sendSuccess(res, { appointments }, 'Appointments fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function confirmForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentService.confirmForAdmin(req.params.id);
    sendSuccess(res, { appointment }, 'Appointment confirmed successfully');
  } catch (err) {
    next(err);
  }
}

async function assignForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const appointment = await appointmentService.assignForAdmin(req.params.id, req.body.psychologistId, req.user.id);
    sendSuccess(res, { appointment }, 'Psychologist assigned successfully');
  } catch (err) { next(err); }
}

async function handleMyselfForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const appointment = await appointmentService.assignForAdmin(req.params.id, req.user.id, req.user.id);
    sendSuccess(res, { appointment }, 'Appointment assigned to you successfully');
  } catch (err) { next(err); }
}

async function myPsychologistDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    sendSuccess(res, { dashboard: await appointmentService.psychologistSummary(req.user.id) });
  } catch (err) { next(err); }
}

async function completeForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentService.completeForAdmin(req.params.id);
    sendSuccess(res, { appointment }, 'Appointment marked as completed successfully');
  } catch (err) {
    next(err);
  }
}

async function cancelForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentService.cancelForAdmin(req.params.id, req.body.reason);
    sendSuccess(res, { appointment }, 'Appointment cancelled successfully');
  } catch (err) {
    next(err);
  }
}

async function rescheduleForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const appointment = await appointmentService.rescheduleForAdmin(req.params.id, req.body);
    sendSuccess(res, { appointment }, 'Appointment rescheduled successfully');
  } catch (err) {
    next(err);
  }
}

export const appointmentController = {
  book,
  listMine,
  cancelMine,
  rescheduleMine,
  listAllForAdmin,
  confirmForAdmin,
  assignForAdmin,
  handleMyselfForAdmin,
  myPsychologistDashboard,
  completeForAdmin,
  cancelForAdmin,
  rescheduleForAdmin,
};
