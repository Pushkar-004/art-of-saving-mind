import { Request, Response, NextFunction } from 'express';
import { paymentService } from '@/modules/payment/payment.service';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import { env } from '@/config/env';

// ─── Patient ─────────────────────────────────────────────────────────────────

async function getPaymentForAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.getOrCreateForPatient(
      req.params.appointmentId,
      req.user!.id,
    );
    sendSuccess(res, { payment });
  } catch (err) {
    next(err);
  }
}

async function submitPayment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw AppError.badRequest('Payment screenshot image is required');
    }

    // Build the public URL path for the uploaded file
    const screenshotUrl = `/uploads/payment-proofs/${req.file.filename}`;

    const payment = await paymentService.submitPayment(
      req.params.appointmentId,
      req.user!.id,
      {
        screenshotUrl,
        transactionReference: req.body.transactionReference,
      },
    );
    sendSuccess(res, { payment }, 'Payment submitted successfully');
  } catch (err) {
    next(err);
  }
}

async function createRazorpayOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await paymentService.createRazorpayOrder(
      req.params.appointmentId,
      req.user!.id,
    );
    sendSuccess(res, { order }, 'Razorpay order created');
  } catch (err) {
    next(err);
  }
}

async function verifyRazorpayPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.verifyRazorpayPayment(
      req.params.appointmentId,
      req.user!.id,
      req.body,
    );
    sendSuccess(res, { payment }, 'Razorpay payment verified successfully');
  } catch (err) {
    next(err);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

async function listAll(req: Request, res: Response, next: NextFunction) {
  try {
    const payments = await paymentService.listAll();
    sendSuccess(res, { payments });
  } catch (err) {
    next(err);
  }
}

async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.verifyPayment(
      req.params.paymentId,
      req.user!.id,
      req.body.remarks,
    );
    sendSuccess(res, { payment }, 'Payment verified');
  } catch (err) {
    next(err);
  }
}

async function rejectPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.rejectPayment(
      req.params.paymentId,
      req.user!.id,
      req.body.remarks,
    );
    sendSuccess(res, { payment }, 'Payment rejected');
  } catch (err) {
    next(err);
  }
}

// ─── Settings (both roles can GET, only admin can PATCH) ──────────────────────

async function getSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await paymentService.getSettings();
    sendSuccess(res, { settings });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await paymentService.updateSettings(req.body);
    sendSuccess(res, { settings }, 'Payment settings updated');
  } catch (err) {
    next(err);
  }
}

export const paymentController = {
  getPaymentForAppointment,
  submitPayment,
  listAll,
  verifyPayment,
  rejectPayment,
  getSettings,
  updateSettings,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
