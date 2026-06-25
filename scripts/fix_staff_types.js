const fs = require('fs');
const path = require('path');

const filesToFix = [
  'web/__tests__/auth.test.ts',
  'web/__tests__/role-permissions.test.ts',
  'web/app/api/admin/announcements/[id]/route.ts',
  'web/app/api/admin/announcements/route.ts',
  'web/app/api/admin/courses/[id]/route.ts',
  'web/app/api/admin/invitations/route.ts',
  'web/app/api/attendance/bulk/route.ts',
  'web/app/api/attendance/reports/route.ts',
  'web/app/api/attendance/route.ts',
  'web/app/api/calendar/[id]/route.ts',
  'web/app/api/calendar/route.ts',
  'web/app/api/classes/route.ts',
  'web/app/api/dashboard/grade-distribution/route.ts',
  'web/app/api/reports/grades/route.ts',
  'web/app/api/reports/report-card/route.ts',
  'web/app/api/students/bulk-archive/route.ts',
  'web/app/api/students/route.ts',
  'web/app/api/timetable/[id]/route.ts',
  'web/app/api/timetable/all/route.ts',
  'web/app/api/timetable/route.ts',
  'web/app/api/timetable/weekly-notes/route.ts',
  'web/app/dashboard/admin/invitations/page.tsx',
  'web/app/dashboard/timetable/page.tsx',
  'web/hooks/usePermissions.tsx',
  'web/hooks/useUser.ts',
  'web/lib/auth/index.ts',
  'web/lib/auth/navigation.config.ts',
  'web/lib/auth/permissions/abilities.ts',
  'web/lib/middleware/withAuth.ts',
  'web/lib/repositories/DashboardRepository.ts'
];

for (const filePath of filesToFix) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    // Array cleanups
    content = content.replace(/['"]staff['"]\s*,\s*/g, '');
    content = content.replace(/,\s*['"]staff['"]/g, '');
    content = content.replace(/\[\s*['"]staff['"]\s*\]/g, '["admin"]');
    
    // Auth tests
    if (filePath.includes('auth.test.ts')) {
      content = content.replace(/expect\(isAtLeast\("admin", "staff"\)\)\.toBe\(true\);/g, '');
    }
    
    // Role permissions test
    if (filePath.includes('role-permissions.test.ts')) {
      content = content.replace(/expect\(ROLE_CONFIG\.staff\)\.toBeDefined\(\);\s*/g, '');
      content = content.replace(/expect\(ROLE_CONFIG\.staff\.label\)\.toBe\('Nhân viên'\);\s*/g, '');
      content = content.replace(/expect\(uniqueColors\.size\)\.toBe\(8\);/g, 'expect(uniqueColors.size).toBe(7);');
      content = content.replace(/expect\(isValidRole\('staff'\)\)\.toBe\(true\);\s*/g, '');
      content = content.replace(/expect\(hasHigherOrEqualRole\('staff', 'teacher'\)\)\.toBe\(true\);\s*/g, '');
      content = content.replace(/expect\(hasHigherOrEqualRole\('teacher', 'staff'\)\)\.toBe\(false\);\s*/g, '');

      content = content.replace(/expect\(canModifyUserRole\('admin', 'staff'\)\)\.toBe\(true\);\s*/g, '');
      content = content.replace(/expect\(canModifyUserRole\('owner', 'staff'\)\)\.toBe\(true\);\s*/g, '');

      content = content.replace(/it\('should allow staff to modify teacher\/student roles', \(\) => \{[\s\S]*?\}\);\s*/g, '');
      content = content.replace(/it\('should NOT allow staff to modify admin\/staff roles', \(\) => \{[\s\S]*?\}\);\s*/g, '');
      content = content.replace(/it\('should NOT allow staff to promote users to admin\/staff', \(\) => \{[\s\S]*?\}\);\s*/g, '');
      content = content.replace(/expect\(canModifyUserRole\('admin', 'teacher', 'staff'\)\)\.toBe\(true\);\s*/g, '');

      content = content.replace(/it\('should return all eight roles', \(\) => \{/g, "it('should return all seven roles', () => {");
      content = content.replace(/expect\(roles\)\.toHaveLength\(8\);/g, 'expect(roles).toHaveLength(7);');
      content = content.replace(/expect\(roles\)\.toContain\('staff'\);\s*/g, '');

      content = content.replace(/it\('staff should keep grades\.entry and grades\.manage but NOT have teacher mark attendance', \(\) => \{[\s\S]*?\}\);\s*/g, '');
    }

    // Direct comparisons
    content = content.replace(/===\s*['"]staff['"]/g, "=== 'admin'");
    content = content.replace(/!==\s*['"]staff['"]/g, "!== 'admin'");
    
    // staffAuth removal or replace
    content = content.replace(/staffAuth/g, 'adminAuth');

    // duplicate adminAuth
    content = content.replace(/import\s*\{\s*adminAuth\s*,\s*adminAuth\s*\}\s*from/g, 'import { adminAuth } from');
    content = content.replace(/adminAuth,\s*adminAuth/g, 'adminAuth');

    // Abilities / navigation config object keys
    content = content.replace(/\bstaff:\s*\[/g, '/* staff removed */');
    content = content.replace(/\bstaff:\s*\{/g, '/* staff removed */');

    if (content !== original) {
      fs.writeFileSync(fullPath, content);
      console.log('Fixed:', filePath);
    }
  } else {
    console.log('File not found:', fullPath);
  }
}
console.log('Done script.');
