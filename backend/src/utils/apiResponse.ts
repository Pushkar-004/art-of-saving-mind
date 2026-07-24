import { Response } from 'express';

// Matches the envelope the frontend already expects from
// lib/api/client.ts: { success, data, message }.
export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  data: null;
  errors?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): Response<ApiSuccessBody<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown,
): Response<ApiErrorBody> {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(errors !== undefined ? { errors } : {}),
  });
}
