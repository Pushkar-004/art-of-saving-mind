import { z } from 'zod';

export const appointmentIdParamSchema = z.object({
  params: z.object({
    appointmentId: z.string().uuid('Invalid appointment ID'),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
  }),
});

export const submitPaymentSchema = z.object({
  params: z.object({
    appointmentId: z.string().uuid('Invalid appointment ID'),
  }),
  body: z.object({
    // screenshotUrl is injected from the multer upload (file path), not the request body
    transactionReference: z.string().max(100).optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  params: z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
  }),
  body: z.object({
    remarks: z.string().max(500).optional(),
  }),
});

export const rejectPaymentSchema = z.object({
  params: z.object({
    paymentId: z.string().uuid('Invalid payment ID'),
  }),
  body: z.object({
    remarks: z.string().min(1, 'Rejection reason is required').max(500),
  }),
});

export const updatePaymentSettingsSchema = z.object({
  body: z.object({
    clinicName: z.string().min(1).max(200).optional(),
    upiId: z.string().min(1).max(100).optional(),
    qrImageUrl: z.string().url().nullable().optional(),
    paymentInstructions: z.string().max(1000).nullable().optional(),
  }),
});

export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>['body'] & {
  screenshotUrl?: string; // injected by controller after multer upload
};
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>['body'];
export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>['body'];
export type UpdatePaymentSettingsInput = z.infer<typeof updatePaymentSettingsSchema>['body'];
