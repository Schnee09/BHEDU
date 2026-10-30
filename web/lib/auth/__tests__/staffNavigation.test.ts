import { getNavigationForPermissions } from '@/lib/auth/navigation.config';
import type { PermissionCode } from '@/lib/auth/core';

function collectHrefs(sections: ReturnType<typeof getNavigationForPermissions>): string[] {
  return sections.flatMap((section) => [
    ...(section.links || []).map((link) => link.href),
    ...(section.groups || []).flatMap((group) => group.links.map((link) => link.href)),
  ]);
}

describe('staff navigation preset', () => {
  it('shows only operational links granted to the staff account', () => {
    const permissions = new Set<PermissionCode>([
      'students.view',
      'attendance.view',
      'finance.view',
    ]);

    const hrefs = collectHrefs(getNavigationForPermissions(permissions, 'staff'));

    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/dashboard/admin/reception');
    expect(hrefs).toContain('/dashboard/students');
    expect(hrefs).toContain('/dashboard/attendance/history');
    expect(hrefs).toContain('/dashboard/admin/finance');
    expect(hrefs).toContain('/dashboard/profile');

    expect(hrefs).not.toContain('/dashboard/users');
    expect(hrefs).not.toContain('/dashboard/settings');
    expect(hrefs).not.toContain('/dashboard/admin/finance/tuition-matrix');
    expect(hrefs).not.toContain('/dashboard/attendance/mark');
  });
});
