export function calculateAttendanceRate(statuses: string[]): number | null {
  if (statuses.length === 0) return null;

  const presentCount = statuses.filter(
    (status) => status === 'present' || status === 'late'
  ).length;
  return Math.round((presentCount / statuses.length) * 100);
}
