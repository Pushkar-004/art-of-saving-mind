import { Request, Response, NextFunction } from 'express';
import { authService } from '@/modules/auth/auth.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';

const REFRESH_COOKIE_NAME = 'refreshToken';

// Centralized cookie options so login/signup/refresh/logout all agree
// on how the refresh-token cookie is set and cleared.
function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — keep in sync with JWT_REFRESH_EXPIRES_IN
  };
}

async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup(req.body);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

    sendSuccess(
      res,
      { user: result.user, accessToken: result.tokens.accessToken },
      'Account created successfully',
      201,
    );
  } catch (err) {
    next(err);
  }
}

async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

    sendSuccess(
      res,
      { user: result.user, accessToken: result.tokens.accessToken },
      'Login successful',
    );
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.forgotPassword(req.body);

    // Generic message regardless of outcome — see auth.service.ts for why.
    sendSuccess(
      res,
      null,
      "If an account with that email exists, we've sent a password reset link.",
    );
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    await authService.resetPassword(req.body, token);

    sendSuccess(res, null, 'Your password has been reset successfully.');
  } catch (err) {
    next(err);
  }
}

async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw AppError.unauthorized('Not authenticated');
    }
    const user = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, { user }, 'Current user fetched successfully');
  } catch (err) {
    next(err);
  }
}

async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      throw AppError.unauthorized('Missing refresh token');
    }

    const result = await authService.refreshTokens(token);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions());

    sendSuccess(
      res,
      { user: result.user, accessToken: result.accessToken },
      'Token refreshed successfully',
    );
  } catch (err) {
    next(err);
  }
}

async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      path: '/api/auth',
    });

    sendSuccess(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export const authController = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  refresh,
  logout,
};
