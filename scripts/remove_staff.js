const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      
      // Replace arrays containing staff and admin
      content = content.replace(/\['admin',\s*'staff'\]/g, "['admin']");
      content = content.replace(/\['staff',\s*'admin'\]/g, "['admin']");
      content = content.replace(/\["admin",\s*"staff"\]/g, '["admin"]');
      content = content.replace(/\["staff",\s*"admin"\]/g, '["admin"]');
      
      // Replace arrays containing only staff
      content = content.replace(/\['staff'\]/g, "['admin']");
      content = content.replace(/\["staff"\]/g, '["admin"]');
      
      // Also handle cases like ['owner', 'admin', 'staff']
      content = content.replace(/\b'staff',\s*/g, '');
      content = content.replace(/,\s*'staff'\b/g, '');
      content = content.replace(/\b"staff",\s*/g, '');
      content = content.replace(/,\s*"staff"\b/g, '');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

processDir('web/app/api');
// also do web/app/dashboard since we might have staff mentions there
processDir('web/app/dashboard');
console.log('Done.');
