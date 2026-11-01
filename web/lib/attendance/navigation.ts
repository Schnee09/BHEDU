type SearchParamsReader = Pick<URLSearchParams, 'get'>;

export function getAttendanceClassId(searchParams: SearchParamsReader): string {
  return (
    searchParams.get('classId') ||
    searchParams.get('class') ||
    searchParams.get('class_id') ||
    ''
  ).trim();
}
