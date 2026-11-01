/**
 * Date Utilities for KampusKit
 * Ensures strictly local timezone operations (avoids UTC toISOString day-shift bugs).
 */

/**
 * Returns YYYY-MM-DD string in device local timezone
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns HH:mm string in device local timezone
 */
export function formatLocalTime(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parses deadline string into local Date object.
 * Handles:
 * - 'YYYY-MM-DD' (sets time to end of that day 23:59:59 in local time)
 * - 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DD HH:mm'
 * - ISO string with timezone or millisecond timestamp
 */
export function parseDeadline(deadlineStr: string | null | undefined): Date {
  if (!deadlineStr || typeof deadlineStr !== 'string') {
    const fallback = new Date();
    fallback.setHours(23, 59, 59, 999);
    return fallback;
  }

  const trimmed = deadlineStr.trim();

  // Match YYYY-MM-DD
  const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = parseInt(dateOnlyMatch[1], 10);
    const month = parseInt(dateOnlyMatch[2], 10) - 1;
    const day = parseInt(dateOnlyMatch[3], 10);
    return new Date(year, month, day, 23, 59, 59, 999);
  }

  // Match YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm
  const dateTimeMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (dateTimeMatch) {
    const year = parseInt(dateTimeMatch[1], 10);
    const month = parseInt(dateTimeMatch[2], 10) - 1;
    const day = parseInt(dateTimeMatch[3], 10);
    const hour = parseInt(dateTimeMatch[4], 10);
    const minute = parseInt(dateTimeMatch[5], 10);
    const sec = dateTimeMatch[6] ? parseInt(dateTimeMatch[6], 10) : 0;
    return new Date(year, month, day, hour, minute, sec);
  }

  // Fallback to standard Date parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date();
  fallback.setHours(23, 59, 59, 999);
  return fallback;
}

/**
 * Compares two dates by calendar day (ignoring time) in local timezone
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Adds integer days to a Date returning a new Date in local timezone
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculates calendar day difference (d2 - d1) in local timezone
 */
export function diffDays(d1: Date | string, d2: Date | string): number {
  const date1 = typeof d1 === 'string' ? parseDeadline(d1) : d1;
  const date2 = typeof d2 === 'string' ? parseDeadline(d2) : d2;
  const start = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate()).getTime();
  const end = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate()).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Determines whether a deadline is overdue compared to current reference time
 */
export function isOverdue(deadlineStr: string, now: Date = new Date()): boolean {
  const deadline = parseDeadline(deadlineStr);
  return deadline.getTime() < now.getTime();
}

/**
 * Indonesian Day Name
 */
export const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

export function getDayNameId(date: Date): string {
  return DAYS_ID[date.getDay()];
}

/**
 * English Day Name
 */
export const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export function getDayNameEn(date: Date): string {
  return DAYS_EN[date.getDay()];
}

/**
 * Parses 'HH:MM' time string into minutes from start of day (0..1439)
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formats minutes from start of day (0..1439) into 'HH:MM'
 */
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
