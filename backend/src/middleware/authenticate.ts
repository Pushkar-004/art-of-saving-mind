import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '@/utils/AppError';
import { verifyAccessToken } from '@/utils/jwt';

// Augment Express's Request type so req.user is available and typed
// in every downstream controller/middleware.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email: string;
      };
    }
  }
}

// Reads the access token from the Authorization header
// ("Authorization: Bearer <token>"), verifies it, and attaches the
// decoded identity to req.user. Does NOT touch cookies — the refresh
// token (httpOnly cookie) is only read by the /auth/refresh endpoint.
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next(AppError.unauthorized('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    next(AppError.unauthorized('Missing access token'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired access token'));
  }
}

// Same idea as `authenticate`, but never rejects the request — used by
// routes that must work for both guests and logged-in users (e.g. the
// public appointment booking endpoint, which links the booking to a
// patient when a valid token happens to be present, but still allows
// the request through with req.user left undefined otherwise).
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
  } catch {
    // Invalid/expired token on an optional route — proceed as a guest
    // rather than rejecting; the route itself doesn't require auth.
  }
  next();
}
