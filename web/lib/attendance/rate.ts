export function calculateAttendanceRate(statuses: string[], decimalPlaces = 0): number | null {
  if (statuses.length === 0) return null;

  const presentCount = statuses.filter(
    (status) => status === 'present' || status === 'late'
  ).length;
  const precision = 10 ** decimalPlaces;

  return Math.round((presentCount / statuses.length) * 100 * precision) / precision;
}
