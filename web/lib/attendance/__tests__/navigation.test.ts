import { getAttendanceClassId } from '../navigation';

describe('getAttendanceClassId', () => {
  it.each([
    ['classId=class-1', 'class-1'],
    ['class=class-2', 'class-2'],
    ['class_id=class-3', 'class-3'],
  ])('reads supported attendance links from %s', (query, expected) => {
    expect(getAttendanceClassId(new URLSearchParams(query))).toBe(expected);
  });

  it('prefers the canonical classId parameter', () => {
    expect(getAttendanceClassId(new URLSearchParams('classId=current&class=legacy'))).toBe(
      'current'
    );
  });
});
