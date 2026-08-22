export const CAMPUSES = [
  {
    id: 'Ngô Quyền',
    name: 'Ngô Quyền',
    rooms: ['P.01', 'P.02', 'P.03', 'P.04', 'P.05', 'P.06', 'P.07', 'P.08'],
  },
  {
    id: 'Đặng Văn Bi',
    name: 'Đặng Văn Bi',
    rooms: ['P.01', 'P.02', 'P.03', 'P.04'],
  },
];

export const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

export const WEEKDAY_SESSIONS = [
  { id: 1, label: 'Ca 1', time: '17:00 - 18:30', start: '17:00', end: '18:30' },
  { id: 2, label: 'Ca 2', time: '18:30 - 20:00', start: '18:30', end: '20:00' },
  { id: 3, label: 'Ca 3', time: '20:00 - 21:30', start: '20:00', end: '21:30' },
];

export const SATURDAY_SESSIONS = [
  { id: 1, label: 'S1', time: '08:00 - 09:30', start: '08:00', end: '09:30' },
  { id: 2, label: 'S2', time: '09:30 - 11:00', start: '09:30', end: '11:00' },
  { id: 3, label: 'C1', time: '14:00 - 15:30', start: '14:00', end: '15:30' },
  { id: 4, label: 'C2', time: '15:30 - 17:00', start: '15:30', end: '17:00' },
  { id: 5, label: 'C3', time: '17:00 - 18:30', start: '17:00', end: '18:30' },
  { id: 6, label: 'C4', time: '18:30 - 20:00', start: '18:30', end: '20:00' },
  { id: 7, label: 'C5', time: '20:00 - 21:30', start: '20:00', end: '21:30' },
];

export const SUNDAY_SESSIONS = [
  { id: 1, label: 'S1', time: '08:00 - 09:30', start: '08:00', end: '09:30' },
  { id: 2, label: 'S2', time: '09:30 - 11:00', start: '09:30', end: '11:00' },
  { id: 3, label: 'C1', time: '14:00 - 15:30', start: '14:00', end: '15:30' },
  { id: 4, label: 'C2', time: '15:30 - 17:00', start: '15:30', end: '17:00' },
  { id: 5, label: 'C3', time: '17:00 - 18:30', start: '17:00', end: '18:30' },
  { id: 6, label: 'C4', time: '18:30 - 20:00', start: '18:30', end: '20:00' },
];

export const ALL_SESSIONS = [
  { id: 1, label: 'S1', time: '08:00 - 09:30', start: '08:00', end: '09:30', days: [5, 6] },
  { id: 2, label: 'S2', time: '09:30 - 11:00', start: '09:30', end: '11:00', days: [5, 6] },
  { id: 3, label: 'C1', time: '14:00 - 15:30', start: '14:00', end: '15:30', days: [5, 6] },
  { id: 4, label: 'C2', time: '15:30 - 17:00', start: '15:30', end: '17:00', days: [5, 6] },
  {
    id: 5,
    label: 'Ca 1',
    time: '17:00 - 18:30',
    start: '17:00',
    end: '18:30',
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 6,
    label: 'Ca 2',
    time: '18:30 - 20:00',
    start: '18:30',
    end: '20:00',
    days: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 7,
    label: 'Ca 3',
    time: '20:00 - 21:30',
    start: '20:00',
    end: '21:30',
    days: [0, 1, 2, 3, 4, 5],
  },
];

export const getSessionsForDay = (dayIndex: number) => {
  return ALL_SESSIONS.filter((s) => s.days.includes(dayIndex));
};

export const isSessionAvailable = (sessionStart: string, dayIndex: number) => {
  const session = ALL_SESSIONS.find((s) => s.start === sessionStart);
  return session ? session.days.includes(dayIndex) : false;
};
