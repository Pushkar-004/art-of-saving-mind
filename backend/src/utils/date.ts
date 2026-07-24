// Single source of truth for date handling across the appointment +
// availability system. Every module that deals with calendar dates
// (weekly availability, blocked dates, slot generation, booking,
// rescheduling) must go through these helpers instead of constructing
// Dates ad hoc — that inconsistency (some code using getUTCDay() /
// "...T00:00:00.000Z" / toISOString(), other code using local
// getters) was the root cause of slots generating against the wrong
// weekday and bookings landing on the wrong calendar date whenever the
// server's timezone wasn't UTC.
//
// Strategy: a booking date like "2026-06-29" is always treated as a
// LOCAL calendar date with no time-of-day meaning — never parsed as
// UTC, never round-tripped through toISOString(). The JS Date object
// is only ever a convenient container for { year, month, day } in the
// server's local timezone; we always read it back out with the local
// getters (getFullYear/getMonth/getDate/getDay), never the UTC ones.

import { DayOfWeek } from '@prisma/client';

const JS_DAY_INDEX_TO_ENUM: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * Parses a "YYYY-MM-DD" string into a Date representing local midnight
 * on that calendar date. Never use `new Date("YYYY-MM-DD")` or
 * `new Date("YYYY-MM-DDT00:00:00.000Z")` for this — both parse as UTC
 * per the ECMA spec, which silently shifts the calendar date by one
 * day in any timezone behind UTC.
 */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formats a Date back into "YYYY-MM-DD" using LOCAL getters. Never use
 * `toISOString().slice(0, 10)` for this — it converts to UTC first,
 * which is exactly the inverse of the parseDateOnly bug above.
 */
export function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Maps a Date to our DayOfWeek enum using the LOCAL weekday
 * (getDay()), matching parseDateOnly/toDateKey above. Never use
 * getUTCDay() here — mixing it with the local-date helpers above is
 * exactly what caused weekly-slot lookups to match the wrong weekday
 * near midnight in non-UTC timezones.
 */
export function dayOfWeekFromDate(date: Date): DayOfWeek {
  return JS_DAY_INDEX_TO_ENUM[date.getDay()];
}

/** Returns local midnight "today", for comparisons like "is this date in the past". */
export function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/** Local midnight for an arbitrary Date, without mutating the input. */
export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
