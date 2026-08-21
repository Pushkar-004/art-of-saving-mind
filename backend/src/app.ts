import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from '@/config/env';
import { errorHandler } from '@/middleware/errorHandler';
import { sendSuccess } from '@/utils/apiResponse';
import { AppError } from '@/utils/AppError';
import authRoutes from '@/modules/auth/auth.routes';
import patientRoutes from '@/modules/patient/patient.routes';
import medicalHistoryRoutes from '@/modules/medical-history/medical-history.routes';
import emergencyContactRoutes from '@/modules/emergency-contact/emergency-contact.routes';
import availabilityRoutes from '@/modules/availability/availability.routes';
import appointmentRoutes from '@/modules/appointment/appointment.routes';
import notificationRoutes from '@/modules/notification/notification.routes';
import aiRoutes from '@/modules/ai/ai.routes';
import resourceRoutes from '@/modules/resource/resource.routes';
import sessionNoteRoutes from '@/modules/session-note/session-note.routes';
import mySessionNotesRoutes from '@/modules/session-note/my-session-notes.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';
import reportRoutes from '@/modules/report/report.routes';
import paymentRoutes from '@/modules/payment/payment.routes';
import psychologistRoutes from '@/modules/psychologist/psychologist.routes';
import { startReminderScheduler } from '@/lib/reminderScheduler';
import { availabilityService } from '@/modules/availability/availability.service';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Serve uploaded payment proof images.
  // IMPORTANT: resolved relative to this file (__dirname), NOT process.cwd().
  // process.cwd() depends on the directory the Node process was launched
  // from (IDE run config, nodemon/ts-node-dev cwd, Docker WORKDIR, etc.) and
  // can silently diverge from the backend/ project root, which is what was
  // causing "/uploads/..." requests to miss express.static and fall through
  // to the catch-all 404 handler even though the files existed on disk.
  const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
  app.use('/uploads', express.static(UPLOADS_ROOT));

  if (!env.isProduction) {
    app.use(morgan('dev'));
  }

  // Ensure a default weekly schedule exists for a fresh database before the
  // booking flow is used. This prevents the "no slots available" state when
  // availability has never been configured by the admin.
  void availabilityService.ensureDefaultAvailabilitySeed();

  // Start the appointment reminder cron scheduler
  startReminderScheduler();

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    sendSuccess(res, { uptime: process.uptime() }, 'Service is healthy');
  });

  // ---- API routes ----
  app.use('/api/auth', authRoutes);
  app.use('/api/patient', patientRoutes);
  app.use('/api/medical-history', medicalHistoryRoutes);
  app.use('/api/emergency-contact', emergencyContactRoutes);
  app.use('/api/availability', availabilityRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/resources', resourceRoutes);
  app.use('/api/session-notes', sessionNoteRoutes);
  app.use('/api/my-session-notes', mySessionNotesRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/psychologists', psychologistRoutes);

  // Catch-all for unknown routes.
  app.use((req: Request, _res: Response, next) => {
    next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Must be registered last.
  app.use(errorHandler);

  return app;
}
