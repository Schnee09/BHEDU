import { TimetableSlot } from './types';
import { DAYS } from './constants';

export const getSlotForRoomCell = (
  slots: TimetableSlot[],
  campusName: string,
  room: string,
  dayIndex: number,
  startTime: string
): TimetableSlot | undefined => {
  const fullRoomName = `${campusName} - ${room}`;
  return slots.find(
    (slot) =>
      slot.room === fullRoomName &&
      slot.day_of_week === dayIndex &&
      slot.start_time?.substring(0, 5) === startTime
  );
};

export const getSlotForClassCell = (
  slots: TimetableSlot[],
  dayIndex: number,
  startTime: string
): TimetableSlot | undefined => {
  return slots.find(
    (slot) => slot.day_of_week === dayIndex && slot.start_time?.substring(0, 5) === startTime
  );
};

export const getSlotForTeacherCell = (
  slots: TimetableSlot[],
  teacherId: string,
  dayIndex: number,
  startTime: string
): TimetableSlot | undefined => {
  return slots.find(
    (slot) =>
      slot.teacher?.id === teacherId &&
      slot.day_of_week === dayIndex &&
      slot.start_time?.substring(0, 5) === startTime
  );
};

export const getWeekDates = (currentWeek: Date) => {
  const start = new Date(currentWeek);
  start.setDate(start.getDate() - start.getDay() + 1);
  return DAYS.map((_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
};
