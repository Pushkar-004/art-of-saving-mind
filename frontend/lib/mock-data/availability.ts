// Centralized mock availability data — frontend only, no backend.

export interface TimeSlot {
  id: string
  start: string // "09:00"
  end: string // "10:00"
  enabled: boolean
}

export interface DayAvailability {
  day: string
  short: string
  isWorking: boolean
  slots: TimeSlot[]
}

export const weeklyAvailability: DayAvailability[] = [
  {
    day: 'Monday',
    short: 'Mon',
    isWorking: true,
    slots: [
      { id: 'mon-1', start: '09:00', end: '10:00', enabled: true },
      { id: 'mon-2', start: '11:00', end: '12:00', enabled: true },
      { id: 'mon-3', start: '14:00', end: '15:00', enabled: true },
      { id: 'mon-4', start: '16:00', end: '17:00', enabled: false },
    ],
  },
  {
    day: 'Tuesday',
    short: 'Tue',
    isWorking: true,
    slots: [
      { id: 'tue-1', start: '10:00', end: '11:00', enabled: true },
      { id: 'tue-2', start: '13:00', end: '14:00', enabled: true },
      { id: 'tue-3', start: '15:00', end: '16:00', enabled: true },
    ],
  },
  {
    day: 'Wednesday',
    short: 'Wed',
    isWorking: true,
    slots: [
      { id: 'wed-1', start: '09:00', end: '10:00', enabled: true },
      { id: 'wed-2', start: '11:00', end: '12:00', enabled: false },
      { id: 'wed-3', start: '14:00', end: '15:00', enabled: true },
    ],
  },
  {
    day: 'Thursday',
    short: 'Thu',
    isWorking: true,
    slots: [
      { id: 'thu-1', start: '10:00', end: '11:00', enabled: true },
      { id: 'thu-2', start: '12:00', end: '13:00', enabled: true },
      { id: 'thu-3', start: '15:00', end: '16:00', enabled: true },
    ],
  },
  {
    day: 'Friday',
    short: 'Fri',
    isWorking: true,
    slots: [
      { id: 'fri-1', start: '09:00', end: '10:00', enabled: true },
      { id: 'fri-2', start: '11:00', end: '12:00', enabled: true },
    ],
  },
  {
    day: 'Saturday',
    short: 'Sat',
    isWorking: true,
    slots: [{ id: 'sat-1', start: '10:00', end: '11:00', enabled: true }],
  },
  {
    day: 'Sunday',
    short: 'Sun',
    isWorking: false,
    slots: [],
  },
]

export interface BlockedDate {
  id: string
  date: string
  label: string
}

export const blockedDates: BlockedDate[] = [
  { id: 'bd-1', date: 'Mar 29, 2024', label: 'Personal leave' },
  { id: 'bd-2', date: 'Apr 5, 2024', label: 'Conference' },
  { id: 'bd-3', date: 'Apr 14, 2024', label: 'Public holiday' },
]
