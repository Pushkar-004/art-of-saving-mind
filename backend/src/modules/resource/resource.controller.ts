import { Request, Response, NextFunction } from 'express';
import { resourceService } from '@/modules/resource/resource.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { ListResourcesQuery } from '@/modules/resource/resource.validation';

// ---------------- Admin ----------------

// POST /api/resources
async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const resource = await resourceService.createForAdmin(req.user.id, req.body);
    sendSuccess(res, { resource }, 'Resource created successfully');
  } catch (err) {
    next(err);
  }
}

// PATCH /api/resources/:id
async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const resource = await resourceService.updateForAdmin(req.params.id, req.body);
    sendSuccess(res, { resource }, 'Resource updated successfully');
  } catch (err) {
    next(err);
  }
}

// DELETE /api/resources/:id
async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await resourceService.deleteForAdmin(req.params.id);
    sendSuccess(res, null, 'Resource deleted successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/resources/admin?search=&category=
async function listForAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const resources = await resourceService.listForAdmin(req.query as ListResourcesQuery);
    sendSuccess(res, { resources }, 'Resources fetched successfully');
  } catch (err) {
    next(err);
  }
}

// ---------------- Patient ----------------

// GET /api/resources?search=&category=
async function listForPatient(req: Request, res: Response, next: NextFunction) {
  try {
    const resources = await resourceService.listForPatient(req.query as ListResourcesQuery);
    sendSuccess(res, { resources }, 'Resources fetched successfully');
  } catch (err) {
    next(err);
  }
}

// GET /api/resources/:id
async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const resource = await resourceService.getByIdForPatient(req.params.id);
    sendSuccess(res, { resource }, 'Resource fetched successfully');
  } catch (err) {
    next(err);
  }
}

export const resourceController = {
  create,
  update,
  remove,
  listForAdmin,
  listForPatient,
  getById,
};
