import { z } from 'zod';

// Mirrors the rules already enforced client-side in
// app/auth/reset-password/[token]/page.tsx so server and client never
// disagree: at least 8 characters, one uppercase letter, one number.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// POST /api/auth/signup
// Matches app/auth/signup/page.tsx fields: fullName, email, password,
// confirmPassword. userType is intentionally NOT accepted from the
// client — every self-signup is forced to "patient" server-side.
export const signupSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(2, 'Full name is required'),
      email: z.string().trim().toLowerCase().email('Invalid email address'),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

// POST /api/auth/login
// Matches app/auth/login/page.tsx fields: email, password.
export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// POST /api/auth/forgot-password
// Matches app/auth/forgot-password/page.tsx fields: email.
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email('Invalid email address'),
  }),
});

// POST /api/auth/reset-password/:token
// Matches app/auth/reset-password/[token]/page.tsx fields: password,
// confirmPassword. token comes from the URL param, not the body.
export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string().min(1, 'Reset token is required'),
  }),
  body: z
    .object({
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

// POST /api/auth/refresh — no body, refresh token comes from the
// httpOnly cookie. Schema included for consistency / future query params.
export const refreshTokenSchema = z.object({
  body: z.object({}).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
