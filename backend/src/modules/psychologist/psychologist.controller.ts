import { NextFunction, Request, Response } from 'express';
import { psychologistService } from './psychologist.service';
import { sendSuccess } from '@/utils/apiResponse';

async function list(_req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, { psychologists: await psychologistService.list() }); } catch (error) { next(error); }
}
async function create(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, { psychologist: await psychologistService.create(req.body) }, 'Psychologist added', 201); } catch (error) { next(error); }
}
async function setActive(req: Request, res: Response, next: NextFunction) {
  try { sendSuccess(res, { psychologist: await psychologistService.setActive(req.params.id, req.body.isActive) }); } catch (error) { next(error); }
}
export const psychologistController = { list, create, setActive };
