"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const rootDir = path_1.default.resolve('src');
const regex = /from<([A-Za-z0-9_]+)>/g;
function processFile(filePath) {
    let content = fs_1.default.readFileSync(filePath, 'utf8');
    if (regex.test(content)) {
        const updated = content.replace(regex, 'from<unknown, $1>');
        fs_1.default.writeFileSync(filePath, updated, 'utf8');
        console.log('✅ Fixed:', filePath);
    }
}
function walk(dir) {
    for (const file of fs_1.default.readdirSync(dir)) {
        const fullPath = path_1.default.join(dir, file);
        if (fs_1.default.statSync(fullPath).isDirectory())
            walk(fullPath);
        else if (file.endsWith('.ts'))
            processFile(fullPath);
    }
}
walk(rootDir);
console.log('🎉 Done: Supabase <unknown, T> fix applied.');
//# sourceMappingURL=fix-supabase-types.js.map