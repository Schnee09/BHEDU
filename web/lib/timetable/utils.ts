import { TimetableSlot } from './types';
import { DAYS } from './constants';
import { getStartOfWeek } from '@/lib/utils/date';

const normalizeTime = (time?: string) => {
  if (!time) return '';
  const parts = time.split(':');
  if (parts.length < 2) return time;
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
};

export const getSlotForRoomCell = (
  slots: TimetableSlot[],
  campusName: string,
  room: string,
  dayIndex: number,
  startTime: string
): TimetableSlot | undefined => {
  const fullRoomName = `${campusName} - ${room}`.toLowerCase();
  const roomLower = room.toLowerCase();
  const campusLower = campusName.toLowerCase();
  const isNgoQuyen = campusLower.includes('ngô quyền') || campusLower.includes('nq');
  const normalizedStart = normalizeTime(startTime);

  return slots.find((slot) => {
    if (!slot.room) return false;
    const slotRoomLower = slot.room.toLowerCase();

    const isRoomMatch =
      slotRoomLower === fullRoomName ||
      slotRoomLower === roomLower ||
      (slotRoomLower.includes(roomLower) &&
        (slotRoomLower.includes(campusLower) || (isNgoQuyen && slotRoomLower.includes('nq'))));

    const isTimeMatch = normalizeTime(slot.start_time) === normalizedStart;

    return isRoomMatch && slot.day_of_week === dayIndex && isTimeMatch;
  });
};

export const getSlotForClassCell = (
  slots: TimetableSlot[],
  dayIndex: number,
  startTime: string
): TimetableSlot | undefined => {
  const normalizedStart = normalizeTime(startTime);
  return slots.find(
    (slot) => slot.day_of_week === dayIndex && normalizeTime(slot.start_time) === normalizedStart
  );
};

export const getSlotForTeacherCell = (
  slots: TimetableSlot[],
  teacherId: string,
  dayIndex: number,
  startTime: string
): TimetableSlot | undefined => {
  const normalizedStart = normalizeTime(startTime);
  return slots.find(
    (slot) =>
      slot.teacher?.id === teacherId &&
      slot.day_of_week === dayIndex &&
      normalizeTime(slot.start_time) === normalizedStart
  );
};

export const getWeekDates = (currentWeek: Date) => {
  const start = getStartOfWeek(currentWeek);
  return DAYS.map((_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
};
