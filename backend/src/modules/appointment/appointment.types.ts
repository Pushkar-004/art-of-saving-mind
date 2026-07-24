import { AppointmentMode, AppointmentStatus } from '@prisma/client';

// Mirrors the frontend's Appointment interface exactly
// (lib/mock-data/appointments.ts) so it can be dropped into the
// existing patient/admin appointment pages without reshaping. The
// human-readable `date`/`day`/`month`/`time` strings are derived
// server-side from the stored `date` + `startTime` so the frontend
// needs no date-formatting logic of its own.
export interface AppointmentDTO {
  id: string;
  patientId: string | null;
  patientName: string;
  patientInitials: string;
  service: string;
  therapist: string;
  date: string; // "Thursday, Mar 28" / "Tomorrow" / "Today"
  day: string; // "28"
  month: string; // "Mar"
  dateTime: string; // ISO-ish "YYYY-MM-DDTHH:mm" for sorting/inputs
  time: string; // "3:00 PM"
  type: AppointmentMode; // "online" | "offline" — same field name the frontend's `type` already uses
  status: AppointmentStatus;
  notes?: string;
  // Extra fields beyond the original mock shape, additive only —
  // existing code reading the fields above is unaffected.
  guestEmail?: string | null;
  guestPhone?: string | null;
  isGuest: boolean;
}
