// scripts/print-tree.js
// Usage: node scripts/print-tree.js [path] [maxDepth]
// Example: node scripts/print-tree.js web 3

const fs = require("fs");
const path = require("path");

const start = process.argv[2] || "web";
const maxDepth = Number(process.argv[3] ?? 5);

// folders/files to skip
const IGNORE = new Set([
  "node_modules",
  ".next",
  ".git",
  ".turbo",
  "dist",
  "build",
  "out",
  "coverage",
  "__pycache__",
  ".DS_Store",
  ".vercel",
  ".idea",
  ".vscode"
]);

function printTree(dir, prefix = "", depth = 0) {
  if (depth > maxDepth) return;
  let items;
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    console.error(`${prefix}[error reading ${dir}]`);
    return;
  }

  items = items
    .filter(it => !IGNORE.has(it.name))
    .sort((a, b) =>
      a.isDirectory() === b.isDirectory()
        ? a.name.localeCompare(b.name)
        : a.isDirectory()
        ? -1
        : 1
    );

  items.forEach((it, i) => {
    const isLast = i === items.length - 1;
    const pointer = isLast ? "└─ " : "├─ ";
    console.log(prefix + pointer + it.name);
    if (it.isDirectory()) {
      const newPrefix = prefix + (isLast ? "   " : "│  ");
      printTree(path.join(dir, it.name), newPrefix, depth + 1);
    }
  });
}

console.log(start);
printTree(path.resolve(start));
