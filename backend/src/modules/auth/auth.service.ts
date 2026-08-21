import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { env } from '@/config/env';
import { AppError } from '@/utils/AppError';
import { generateRawToken, hashToken } from '@/utils/token';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/utils/jwt';
import { AuthUserDTO, LoginResultDTO, SignupResultDTO } from '@/modules/auth/auth.types';
import {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
} from '@/modules/auth/auth.validation';
import { PatientStatus, Role, User } from '@prisma/client';
import { sendPasswordResetEmail } from '@/lib/emailService';

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return initials || 'NA';
}

function toAuthUserDTO(user: User): AuthUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarInitials: user.avatarInitials ?? getInitials(user.name),
  };
}

function issueTokensFor(user: User) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken };
}

/**
 * Self-service signup. Always creates a `patient` User AND a linked
 * Patient row in the same transaction — the frontend's signup form
 * (app/auth/signup/page.tsx) only ever submits patient registrations;
 * admin accounts are provisioned manually (see README), never through
 * this endpoint.
 */
async function signup(
  input: SignupInput,
): Promise<SignupResultDTO & { refreshToken: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);
  const avatarInitials = getInitials(input.fullName);

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: input.fullName,
        email: input.email,
        passwordHash,
        role: Role.patient,
        avatarInitials,
      },
    });

    await tx.patient.create({
      data: {
        userId: createdUser.id,
        status: PatientStatus.new,
      },
    });

    return createdUser;
  });

  const tokens = issueTokensFor(user);

  return {
    user: toAuthUserDTO(user),
    tokens: { accessToken: tokens.accessToken },
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Login works for both patients and the admin — role is whatever is
 * stored on the User row, never inferred from the email like the old
 * frontend mock (`email.startsWith('admin')`) used to do.
 */
async function login(
  input: LoginInput,
): Promise<LoginResultDTO & { refreshToken: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }
  if (!user.isActive) {
    throw AppError.unauthorized('This account has been deactivated. Please contact the administrator.');
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const tokens = issueTokensFor(user);

  return {
    user: toAuthUserDTO(user),
    tokens: { accessToken: tokens.accessToken },
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Always responds with a generic success message regardless of whether
 * the email exists, so the endpoint can't be used to enumerate which
 * emails are registered. The actual token is only created if a matching
 * user exists.
 */
async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    return;
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
  );

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const resetLink = `${env.FRONTEND_URL}/auth/reset-password/${rawToken}`;

  // Send the password reset email (fire-and-forget; never breaks this flow)
  void sendPasswordResetEmail({
    to: user.email,
    userName: user.name,
    resetLink,
  });
}

/**
 * Validates the raw token from the URL against the hashed value in the
 * DB, checks expiry + single-use, then updates the password and marks
 * the token consumed in one transaction.
 */
async function resetPassword(input: ResetPasswordInput, rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken) {
    throw AppError.badRequest('Invalid or expired reset token');
  }

  if (resetToken.usedAt) {
    throw AppError.badRequest('This reset link has already been used');
  }

  if (resetToken.expiresAt < new Date()) {
    throw AppError.badRequest('This reset link has expired');
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);
}

async function getCurrentUser(userId: string): Promise<AuthUserDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound('User not found');
  }
  return toAuthUserDTO(user);
}

/**
 * Verifies the refresh token (read from the httpOnly cookie by the
 * controller), confirms the user still exists, and issues a brand new
 * access + refresh token pair (refresh token rotation).
 */
async function refreshTokens(
  refreshToken: string,
): Promise<{ user: AuthUserDTO; accessToken: string; refreshToken: string }> {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }

  const tokens = issueTokensFor(user);

  return {
    user: toAuthUserDTO(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

export const authService = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  refreshTokens,
};
