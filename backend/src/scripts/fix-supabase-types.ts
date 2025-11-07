import fs from 'fs';
import path from 'path';

const rootDir = path.resolve('src');
const regex = /from<([A-Za-z0-9_]+)>/g;

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (regex.test(content)) {
    const updated = content.replace(regex, 'from<unknown, $1>');
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log('✅ Fixed:', filePath);
  }
}

function walk(dir: string) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) walk(fullPath);
    else if (file.endsWith('.ts')) processFile(fullPath);
  }
}

walk(rootDir);
console.log('🎉 Done: Supabase <unknown, T> fix applied.');
