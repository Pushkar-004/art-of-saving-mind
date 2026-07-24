import { Router } from 'express';
import { authController } from '@/modules/auth/auth.controller';
import { validate } from '@/middleware/validate';
import { authenticate } from '@/middleware/authenticate';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
} from '@/modules/auth/auth.validation';

const router = Router();

// POST /api/auth/signup — patient self-registration only.
router.post('/signup', validate(signupSchema), authController.signup);

// POST /api/auth/login — works for both patient and admin.
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/forgot-password — always returns a generic message.
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

// POST /api/auth/reset-password/:token
router.post(
  '/reset-password/:token',
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// POST /api/auth/refresh — reads refresh token from httpOnly cookie.
router.post('/refresh', authController.refresh);

// POST /api/auth/logout — clears the refresh token cookie.
router.post('/logout', authController.logout);

// GET /api/auth/me — protected, requires a valid access token.
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
