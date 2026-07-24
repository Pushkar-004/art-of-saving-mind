import { DayOfWeek } from '@prisma/client';

export interface TimeSlotDTO {
  id: string;
  start: string;
  end: string;
  enabled: boolean;
}

// Mirrors the frontend's DayAvailability shape exactly
// (lib/mock-data/availability.ts) — `day` and `short` are display
// labels derived server-side from the DayOfWeek enum so the frontend
// needs no mapping logic of its own.
export interface DayAvailabilityDTO {
  day: string;
  short: string;
  dayOfWeek: DayOfWeek;
  isWorking: boolean;
  slots: TimeSlotDTO[];
}

export interface BlockedDateDTO {
  id: string;
  date: string; // "YYYY-MM-DD"
  label: string;
}

// A single bookable slot for one specific calendar date — what the
// public booking page and patient/admin booking flows actually
// consume when looking up "what's available on this date".
export interface AvailableSlotDTO {
  date: string; // "YYYY-MM-DD"
  start: string; // "09:00"
  end: string; // "10:00"
}
