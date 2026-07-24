import { Request, Response, NextFunction } from 'express';
import { aiService } from '@/modules/ai/ai.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';

// POST /api/ai/chat — stateless single-turn wellness chat.
async function chat(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized('Not authenticated');
    const reply = await aiService.chat(req.body.message);
    sendSuccess(res, { reply }, 'Reply generated successfully');
  } catch (err) {
    next(err);
  }
}

export const aiController = {
  chat,
};
