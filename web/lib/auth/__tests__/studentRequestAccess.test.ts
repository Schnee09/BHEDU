import { canChangeStudentRequestStatus, canSubmitStudentRequest } from '../studentRequestAccess';

describe('student request access', () => {
  it('only lets a student submit for their own profile', () => {
    expect(canSubmitStudentRequest('student', 'student-1', 'student-1')).toBe(true);
    expect(canSubmitStudentRequest('student', 'student-1', 'student-2')).toBe(false);
  });

  it('requires an approved parent link', () => {
    expect(canSubmitStudentRequest('parent', 'parent-1', 'student-1', true)).toBe(true);
    expect(canSubmitStudentRequest('parent', 'parent-1', 'student-1', false)).toBe(false);
  });

  it('limits teachers to approving or rejecting requests from assigned classes', () => {
    const base = {
      role: 'teacher' as const,
      currentStatus: 'pending' as const,
      isOwner: false,
    };

    expect(
      canChangeStudentRequestStatus({
        ...base,
        nextStatus: 'approved',
        isAssignedTeacher: true,
      })
    ).toBe(true);
    expect(
      canChangeStudentRequestStatus({
        ...base,
        nextStatus: 'approved',
        isAssignedTeacher: false,
      })
    ).toBe(false);
    expect(
      canChangeStudentRequestStatus({
        ...base,
        nextStatus: 'cancelled',
        isAssignedTeacher: true,
      })
    ).toBe(false);
  });

  it('only lets owners cancel a pending request', () => {
    expect(
      canChangeStudentRequestStatus({
        role: 'parent',
        currentStatus: 'pending',
        nextStatus: 'cancelled',
        isOwner: true,
        isAssignedTeacher: false,
      })
    ).toBe(true);
    expect(
      canChangeStudentRequestStatus({
        role: 'parent',
        currentStatus: 'approved',
        nextStatus: 'cancelled',
        isOwner: true,
        isAssignedTeacher: false,
      })
    ).toBe(false);
  });
});
