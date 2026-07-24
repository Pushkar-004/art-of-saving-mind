import { Role } from '@prisma/client';

// Shape returned to the frontend for the "current user" object —
// mirrors the AuthUser interface already defined in the frontend's
// lib/api/client.ts so the response can be dropped in directly.
export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
}

export interface AuthTokensDTO {
  accessToken: string;
}

export interface LoginResultDTO {
  user: AuthUserDTO;
  tokens: AuthTokensDTO;
}

export interface SignupResultDTO {
  user: AuthUserDTO;
  tokens: AuthTokensDTO;
}
