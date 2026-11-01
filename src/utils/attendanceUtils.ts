import { AttendanceRecord } from '../components/AttendanceTracker';

export interface AttendanceStats {
  totalMeetings: number;
  attended: number;
  permit: number;
  absent: number;
  maxAbsent: number;
  remainingAbsentQuota: number;
  ratePercent: number;
  isSafe: boolean; // >= 75%
  isWarning: boolean; // remaining absent quota <= 1
  isCritical: boolean; // remaining absent quota === 0 or rate < 75%
}

/**
 * Calculates academic attendance statistics adhering to standard 75% minimum university requirement.
 */
export function calculateAttendanceStats(record: AttendanceRecord): AttendanceStats {
  const totalMeetings = record.totalMeetings || 16;
  const attended = record.attended || 0;
  const permit = record.permit || 0;
  const absent = record.absent || 0;

  // Maximum allowed absences is 25% of total meetings (e.g. 4 for 16 meetings)
  const maxAbsent = Math.floor(totalMeetings * 0.25);
  const remainingAbsentQuota = Math.max(0, maxAbsent - absent);

  const totalHeld = attended + permit + absent;
  const ratePercent = totalHeld > 0 ? Math.round(((attended + permit) / totalHeld) * 100) : 100;

  const isSafe = ratePercent >= 75 && remainingAbsentQuota > 1;
  const isWarning = remainingAbsentQuota === 1 && ratePercent >= 75;
  const isCritical = remainingAbsentQuota === 0 || ratePercent < 75;

  return {
    totalMeetings,
    attended,
    permit,
    absent,
    maxAbsent,
    remainingAbsentQuota,
    ratePercent,
    isSafe,
    isWarning,
    isCritical
  };
}
