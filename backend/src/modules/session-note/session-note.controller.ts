import { Request, Response, NextFunction } from 'express';
import { sessionNoteService } from '@/modules/session-note/session-note.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

// ---------------- Admin ----------------

// POST /api/session-notes
async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const sessionNote = await sessionNoteService.createForAdmin(req.user.id, req.body);
    sendSuccess(res, { sessionNote }, 'Session note created successfully', 201);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/session-notes/:id
async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionNote = await sessionNoteService.updateForAdmin(req.params.id, req.body);
    sendSuccess(res, { sessionNote }, 'Session note updated successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/session-notes/:appointmentId
async function getByAppointmentId(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionNote = await sessionNoteService.getByAppointmentIdForAdmin(
      req.params.appointmentId,
    );
    sendSuccess(res, { sessionNote }, 'Session note fetched successfully');
  } catch (err) {
    next(err);
  }
}

// ---------------- Patient ----------------

// GET /api/my-session-notes
async function listMine(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const sessionNotes = await sessionNoteService.listMine(req.user.id);
    sendSuccess(res, { sessionNotes }, 'Session notes fetched successfully');
  } catch (err) {
    next(err);
  }
}

export const sessionNoteController = {
  create,
  update,
  getByAppointmentId,
  listMine,
};
