import type { AvailabilitySlot, Booking } from '@/lib/types';

export const BOOKING_CONFLICT_STATUSES: Booking['status'][] = ['pending', 'confirmed'];

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

export function getBookingEndTime(sessionDate: Date | string | number, duration: number) {
  return new Date(toDate(sessionDate).getTime() + duration * 60_000);
}

export function doBookingsOverlap(
  firstStart: Date | string | number,
  firstDuration: number,
  secondStart: Date | string | number,
  secondDuration: number
) {
  const firstStartDate = toDate(firstStart);
  const secondStartDate = toDate(secondStart);
  const firstEndDate = getBookingEndTime(firstStartDate, firstDuration);
  const secondEndDate = getBookingEndTime(secondStartDate, secondDuration);

  return firstStartDate < secondEndDate && secondStartDate < firstEndDate;
}

export function hasBookingConflict(
  bookings: Booking[],
  sessionDate: Date | string | number,
  duration: number,
  options?: {
    excludeBookingId?: string;
    statuses?: Booking['status'][];
  }
) {
  const statuses = options?.statuses ?? BOOKING_CONFLICT_STATUSES;

  return bookings.some((booking) => {
    if (options?.excludeBookingId && booking.id === options.excludeBookingId) {
      return false;
    }

    if (!statuses.includes(booking.status)) {
      return false;
    }

    return doBookingsOverlap(booking.sessionDate, booking.duration, sessionDate, duration);
  });
}

export function isSessionWithinAvailability(
  sessionDate: Date | string | number,
  duration: number,
  availability: AvailabilitySlot[]
) {
  if (availability.length === 0) {
    return true;
  }

  const startDate = toDate(sessionDate);
  const sessionStartMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  const sessionEndMinutes = sessionStartMinutes + duration;

  return availability.some((slot) => {
    if (slot.dayOfWeek !== startDate.getDay()) {
      return false;
    }

    const slotStartMinutes = timeToMinutes(slot.startTime);
    const slotEndMinutes = timeToMinutes(slot.endTime);

    return sessionStartMinutes >= slotStartMinutes && sessionEndMinutes <= slotEndMinutes;
  });
}

export function canBookingBeCompleted(booking: Booking, now = new Date()) {
  return booking.status === 'confirmed' && getBookingEndTime(booking.sessionDate, booking.duration) <= now;
}
