export type AppointmentSessionMode = 'online' | 'offline';

export const SERVICE_PRICE_MAP: Record<string, number> = {
  'Counselling & Therapy': 1200,
  'Child Counselling': 1200,
  'Career Guidance': 500,
  'Marital Counselling': 1200,
  'Relationship Counselling': 1200,
};

export function normalizeServiceName(service: string): string {
  return service.trim();
}

export function getServicePrice(service: string): number {
  return SERVICE_PRICE_MAP[normalizeServiceName(service)] ?? 1200;
}

export function getServicePriceInPaise(service: string): number {
  return getServicePrice(service) * 100;
}

export function getSessionDurationMinutes(startTime: string, endTime?: string): number {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = (endTime ?? '01:00').split(':').map(Number);

  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const durationMinutes = endTotal - startTotal;

  return Math.max(30, durationMinutes || 60);
}

export function getAppointmentPrice(
  service: string,
  mode: AppointmentSessionMode = 'offline',
  durationMinutes = 60,
): number {
  const base = getServicePrice(service);
  const durationHours = Math.max(durationMinutes / 60, 1);
  const subtotal = base * durationHours;
  const discounted = mode === 'online' ? subtotal * 0.95 : subtotal;

  return Math.round(discounted);
}

export function getAppointmentPriceInPaise(
  service: string,
  mode: AppointmentSessionMode = 'offline',
  durationMinutes = 60,
): number {
  return getAppointmentPrice(service, mode, durationMinutes) * 100;
}
