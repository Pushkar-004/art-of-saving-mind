import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '@/modules/availability/availability.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { parseDateOnly, startOfToday } from '@/utils/date';

// GET /api/availability
async function getWeeklyAvailability(_req: Request, res: Response, next: NextFunction) {
  try {
    const week = await availabilityService.getWeeklyAvailability();
    sendSuccess(res, { week }, 'Weekly availability fetched successfully');
  } catch (err) {
    next(err);
  }
}

// PUT /api/availability
async function replaceWeeklyAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const week = await availabilityService.replaceWeeklyAvailability(req.body);
    sendSuccess(res, { week }, 'Availability saved successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/availability/blocked-dates
async function listBlockedDates(_req: Request, res: Response, next: NextFunction) {
  try {
    const blockedDates = await availabilityService.listBlockedDates();
    sendSuccess(res, { blockedDates }, 'Blocked dates fetched successfully');
  } catch (err) {
    next(err);
  }
}

// POST /api/availability/blocked-dates
async function createBlockedDate(req: Request, res: Response, next: NextFunction) {
  try {
    const blockedDate = await availabilityService.createBlockedDate(req.body);
    sendSuccess(res, { blockedDate }, 'Blocked date added successfully', 201);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/availability/blocked-dates/:id
async function deleteBlockedDate(req: Request, res: Response, next: NextFunction) {
  try {
    await availabilityService.deleteBlockedDate(req.params.id);
    sendSuccess(res, null, 'Blocked date removed successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/availability/slots?from=YYYY-MM-DD&to=YYYY-MM-DD
async function getAvailableSlots(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as { from?: string; to?: string };

    const today = startOfToday();
    const defaultTo = new Date(today);
    defaultTo.setDate(defaultTo.getDate() + 30);

    const fromDate = from ? parseDateOnly(from) : today;
    const toDate = to ? parseDateOnly(to) : defaultTo;

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw AppError.badRequest('Invalid from/to date');
    }

    if (fromDate > toDate) {
      throw AppError.badRequest('"from" date must be before "to" date');
    }

    const slots = await availabilityService.getAvailableSlots(fromDate, toDate);
    sendSuccess(res, { slots }, 'Available slots fetched successfully');
  } catch (err) {
    next(err);
  }
}

export const availabilityController = {
  getWeeklyAvailability,
  replaceWeeklyAvailability,
  listBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
  getAvailableSlots,
};