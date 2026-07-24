/**
 * Appointment Reminder Scheduler (Phase 4.8)
 *
 * Runs every hour via node-cron.
 * Finds confirmed/pending appointments occurring within the next 24 hours
 * that have not yet received a reminder.
 * Sends:
 *   1. An email reminder via the existing email service
 *   2. An in-app notification via the existing notification service
 *
 * Uses the `reminderSent` flag on the Appointment model to prevent duplicates.
 * Does NOT modify any existing appointment booking logic.
 */

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/modules/notification/notification.service';
import { sendAppointmentReminderEmail } from '@/lib/emailService';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

async function sendReminders(): Promise<void> {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // Normalise to date-only boundaries (cron runs at :00 so ±1 min is fine)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(in24h);
  tomorrowEnd.setHours(23, 59, 59, 999);

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        reminderSent: false,
        status: { in: ['upcoming', 'pending'] },
        date: {
          gte: now,        // not in the past
          lte: in24h,      // within the next 24 hours
        },
        patient: {
          isNot: null,     // only registered patients (guests have no account to notify)
        },
      },
      include: {
        patient: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (appointments.length === 0) {
      // eslint-disable-next-line no-console
      console.log('[ReminderScheduler] No upcoming appointments to remind.');
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[ReminderScheduler] Sending reminders for ${appointments.length} appointment(s).`);

    for (const appt of appointments) {
      const user = appt.patient?.user;
      if (!user) continue; // skip guests — belt-and-suspenders

      const dateLabel = formatDate(appt.date);
      const timeLabel = formatTime(appt.startTime);

      try {
        // 1. In-app notification
        await notificationService.notifyAppointmentReminder({
          appointmentId: appt.id,
          recipientUserId: user.id,
          service: appt.service,
          dateLabel,
          time: timeLabel,
        });

        // 2. Email reminder
        await sendAppointmentReminderEmail({
          to: user.email,
          patientName: user.name,
          service: appt.service,
          dateLabel,
          time: timeLabel,
        });

        // 3. Mark as reminded to prevent duplicates
        await prisma.appointment.update({
          where: { id: appt.id },
          data: { reminderSent: true },
        });

        // eslint-disable-next-line no-console
        console.log(`[ReminderScheduler] Reminded patient ${user.email} for appointment ${appt.id}`);
      } catch (err) {
        // Log and continue — never abort the whole batch for one failure
        // eslint-disable-next-line no-console
        console.error(`[ReminderScheduler] Failed to remind for appointment ${appt.id}:`, err);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[ReminderScheduler] Failed to query appointments:', err);
  }
}

/**
 * Initialise the cron job. Call once from app startup.
 * Schedule: every hour at :00
 */
export function startReminderScheduler(): void {
  // eslint-disable-next-line no-console
  console.log('[ReminderScheduler] Appointment reminder scheduler started (runs every hour).');

  // Run immediately on startup to catch any missed reminders
  void sendReminders();

  // Then run at the top of every hour
  cron.schedule('0 * * * *', () => {
    void sendReminders();
  });
}
