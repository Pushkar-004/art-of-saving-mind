import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import { AppError } from '@/utils/AppError';
import { sendError } from '@/utils/apiResponse';
import { env } from '@/config/env';

// Must be registered LAST in app.ts, after all routes.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  // Known, deliberately-thrown operational errors.
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Zod validation errors that slipped through without going via the
  // validate() middleware (defensive — validate() normally catches these).
  if (err instanceof ZodError) {
    sendError(res, 'Validation failed', 400, err.flatten());
    return;
  }

  // Multer upload errors (file too large, etc.) and the custom
  // fileFilter rejection in uploadPaymentProof.ts (a plain Error,
  // not a MulterError) — both are client-input problems, not server
  // bugs, so they must surface as 400s with their real message
  // rather than falling through to the generic 500 branch below.
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum allowed size is 5 MB.'
        : err.message;
    sendError(res, message, 400);
    return;
  }
  if (err instanceof Error && /only image files/i.test(err.message)) {
    sendError(res, err.message, 400);
    return;
  }

  // Prisma known request errors (unique constraint violations, etc.)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409, {
        target: err.meta?.target,
      });
      return;
    }
    sendError(res, 'Database request error', 400);
    return;
  }

  // Anything else is an unexpected bug — log full details server-side,
  // but never leak internals to the client.
  // eslint-disable-next-line no-console
  console.error('[UNHANDLED ERROR]', err);

  sendError(
    res,
    env.isProduction ? 'Something went wrong' : (err as Error)?.message ?? 'Unknown error',
    500,
  );
}
