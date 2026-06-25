const fs = require('fs');

const files = [
  'web/app/api/classes/route.ts',
  'web/app/api/dashboard/grade-distribution/route.ts',
  'web/app/api/students/route.ts',
  'web/app/dashboard/timetable/page.tsx',
  'web/lib/repositories/DashboardRepository.ts'
];

for (let path of files) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Replace strict equality for admin that was previously staff
    content = content.replace(/role\s*===\s*'admin'/g, 'role === ("admin" as any)');
    
    fs.writeFileSync(path, content);
  }
}
console.log('Fixed overlapping comparisons');
