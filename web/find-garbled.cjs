const fs = require('fs');
const content = fs.readFileSync('app/dashboard/users/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
    // Search for any suspect garbled Vietnamese-like sequences
    const hex = Buffer.from(l, 'utf8').toString('hex');
    if (hex.includes('e1bb81') || hex.includes('e1bb8d') || hex.includes('e1bb89')) {
        // Check if followed by 45 (uppercase E in hex)
        const idx45 = hex.indexOf('e1bb8145');
        const idx45b = hex.indexOf('e1bb8d45');
        const idx45c = hex.indexOf('e1bb8945');
        if (idx45 >= 0 || idx45b >= 0 || idx45c >= 0) {
            console.log(`Line ${i + 1}: ${l.trimEnd()}`);
        }
    }
});
