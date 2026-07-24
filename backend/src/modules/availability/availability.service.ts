import { AvailabilitySlot, DayOfWeek } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/AppError';
import { dayOfWeekFromDate, parseDateOnly, startOfDay, toDateKey } from '@/utils/date';
import {
  CreateBlockedDateInput,
  ReplaceAvailabilityInput,
} from '@/modules/availability/availability.validation';
import {
  AvailableSlotDTO,
  BlockedDateDTO,
  DayAvailabilityDTO,
  TimeSlotDTO,
} from '@/modules/availability/availability.types';

// Monday-first order for admin UI + weekly config response
const DAY_ORDER: { value: DayOfWeek; day: string; short: string }[] = [
  { value: 'monday', day: 'Monday', short: 'Mon' },
  { value: 'tuesday', day: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', day: 'Wednesday', short: 'Wed' },
  { value: 'thursday', day: 'Thursday', short: 'Thu' },
  { value: 'friday', day: 'Friday', short: 'Fri' },
  { value: 'saturday', day: 'Saturday', short: 'Sat' },
  { value: 'sunday', day: 'Sunday', short: 'Sun' },
];

function toTimeSlotDTO(slot: AvailabilitySlot): TimeSlotDTO {
  return {
    id: slot.id,
    start: slot.startTime,
    end: slot.endTime,
    enabled: slot.isEnabled,
  };
}

/**
 * Returns all 7 days in Monday-first order, even if a day has no slots.
 */
async function getWeeklyAvailability(): Promise<DayAvailabilityDTO[]> {
  const slots = await prisma.availabilitySlot.findMany({
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  return DAY_ORDER.map(({ value, day, short }) => {
    const daySlots = slots.filter((s) => s.dayOfWeek === value).map(toTimeSlotDTO);

    return {
      day,
      short,
      dayOfWeek: value,
      isWorking: daySlots.some((s) => s.enabled),
      slots: daySlots,
    };
  });
}

/**
 * Full replace save model:
 * - update slots that have ids
 * - create slots without ids
 * - delete existing slots omitted from the payload
 */
async function replaceWeeklyAvailability(
  input: ReplaceAvailabilityInput,
): Promise<DayAvailabilityDTO[]> {
  const existing = await prisma.availabilitySlot.findMany({ select: { id: true } });
  const existingIds = new Set(existing.map((s) => s.id));

  const keepIds = new Set(
    input.slots
      .filter((s) => s.id)
      .map((s) => s.id as string),
  );

  const idsToDelete = [...existingIds].filter((id) => !keepIds.has(id));

  await prisma.$transaction([
    ...(idsToDelete.length > 0
      ? [prisma.availabilitySlot.deleteMany({ where: { id: { in: idsToDelete } } })]
      : []),

    ...input.slots.map((slot) =>
      slot.id
        ? prisma.availabilitySlot.update({
            where: { id: slot.id },
            data: {
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isEnabled: slot.isEnabled,
            },
          })
        : prisma.availabilitySlot.create({
            data: {
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isEnabled: slot.isEnabled,
            },
          }),
    ),
  ]);

  return getWeeklyAvailability();
}

async function listBlockedDates(): Promise<BlockedDateDTO[]> {
  const rows = await prisma.blockedDate.findMany({
    orderBy: { date: 'asc' },
  });

  return rows.map((b) => ({
    id: b.id,
    date: toDateKey(b.date),
    label: b.label ?? '',
  }));
}

async function createBlockedDate(input: CreateBlockedDateInput): Promise<BlockedDateDTO> {
  const blockedDate = parseDateOnly(input.date);

  const existing = await prisma.blockedDate.findUnique({
    where: { date: blockedDate },
  });

  if (existing) {
    throw AppError.conflict('This date is already blocked');
  }

  const row = await prisma.blockedDate.create({
    data: {
      date: blockedDate,
      label: input.label,
    },
  });

  return {
    id: row.id,
    date: toDateKey(row.date),
    label: row.label ?? '',
  };
}

async function deleteBlockedDate(id: string): Promise<void> {
  const existing = await prisma.blockedDate.findUnique({ where: { id } });

  if (!existing) {
    throw AppError.notFound('Blocked date not found');
  }

  await prisma.blockedDate.delete({ where: { id } });
}

/**
 * Generate all available slots between [fromDate, toDate].
 *
 * Rules:
 * 1) Skip blocked dates
 * 2) Include enabled weekly slots matching that weekday
 * 3) Exclude already booked non-cancelled appointments
 * 4) Exclude past times if the date is today
 */
async function getAvailableSlots(fromDate: Date, toDate: Date): Promise<AvailableSlotDTO[]> {
  const MAX_RANGE_DAYS = 60;

  const start = startOfDay(fromDate);
  const end = startOfDay(toDate);

  const maxEnd = new Date(start);
  maxEnd.setDate(maxEnd.getDate() + MAX_RANGE_DAYS);

  const cappedEnd = end > maxEnd ? maxEnd : end;

  const [weeklySlots, blocked, bookedAppointments] = await Promise.all([
    prisma.availabilitySlot.findMany({
      where: { isEnabled: true },
    }),
    prisma.blockedDate.findMany({
      where: {
        date: { gte: start, lte: cappedEnd },
      },
    }),
    prisma.appointment.findMany({
      where: {
        date: { gte: start, lte: cappedEnd },
        status: { not: 'cancelled' },
      },
      select: {
        date: true,
        startTime: true,
      },
    }),
  ]);

  const blockedDateKeys = new Set(blocked.map((b) => toDateKey(b.date)));
  const bookedKeys = new Set(
    bookedAppointments.map((a) => `${toDateKey(a.date)}_${a.startTime}`),
  );

  const slotsByDay = new Map<DayOfWeek, AvailabilitySlot[]>();

  for (const slot of weeklySlots) {
    const list = slotsByDay.get(slot.dayOfWeek) ?? [];
    list.push(slot);
    slotsByDay.set(slot.dayOfWeek, list);
  }

  const now = new Date();
  const todayKey = toDateKey(now);

  const result: AvailableSlotDTO[] = [];

  for (
    let cursor = new Date(start);
    cursor <= cappedEnd;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const dateKey = toDateKey(cursor);

    if (blockedDateKeys.has(dateKey)) continue;

    const dayEnum = dayOfWeekFromDate(cursor);
    const daySlots = slotsByDay.get(dayEnum) ?? [];
    const isToday = dateKey === todayKey;

    for (const slot of daySlots) {
      if (bookedKeys.has(`${dateKey}_${slot.startTime}`)) continue;

      if (isToday) {
        const [h, m] = slot.startTime.split(':').map(Number);
        const slotMoment = new Date(cursor);
        slotMoment.setHours(h, m, 0, 0);

        if (slotMoment <= now) continue;
      }

      result.push({
        date: dateKey,
        start: slot.startTime,
        end: slot.endTime,
      });
    }
  }

  return result.sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
}

/**
 * Used by appointment booking service to re-check a slot before booking.
 */
async function isSlotBookable(date: Date, startTime: string): Promise<boolean> {
  const slots = await getAvailableSlots(date, date);
  return slots.some((s) => s.start === startTime);
}

export const availabilityService = {
  getWeeklyAvailability,
  replaceWeeklyAvailability,
  listBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
  getAvailableSlots,
  isSlotBookable,
};