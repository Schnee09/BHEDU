const fs = require('fs');
const path = './app/globals.css';
const content = fs.readFileSync(path, 'utf-8');

const lines = content.split('\n');

let tokens = [];
let glass = [];
let globals = [];

let state = 'globals'; // 'globals', 'tokens', 'glass'

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes('@theme {') || line.includes(':root {') || line.includes('.dark {')) {
        if (state === 'globals' && !line.includes('.dark .glass')) {
            state = 'tokens';
        }
    }

    if (line.includes('/* ============================================') && lines[i + 1] && lines[i + 1].includes('PREMIUM UI UTILITIES')) {
        state = 'glass';
    }

    if (state === 'glass' && line.includes('/* User Interface Density Overrides')) {
        state = 'globals'; // back to globals for remaining stuff
    }

    if (state === 'tokens') {
        tokens.push(line);
        // if end of dark block, stop tokens
        if (line === '}' && lines[i - 1] && lines[i - 1].trim() === '--chart-5: #F472B6;') {
            state = 'globals';
        }
    } else if (state === 'glass') {
        glass.push(line);
    } else {
        globals.push(line);
    }
}

// Ensure proper imports in globals
const imports = [
    "@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap');",
    "@import \"tailwindcss\";",
    "@import \"../styles/tokens.css\";",
    "@import \"../styles/animations.css\";",
    "@import \"../styles/micro-animations.css\";",
    "@import \"../styles/glass.css\";",
    "@import \"../styles/mobile.css\";"
];

// Clean globals: remove old imports and add new ones
globals = imports.concat(globals.filter(l => !l.startsWith('@import') && !l.includes('--chart-5: #F472B6;')));

fs.writeFileSync('./styles/tokens.css', tokens.join('\n'));
fs.writeFileSync('./styles/glass.css', glass.join('\n'));
fs.writeFileSync('./app/globals.css', globals.join('\n'));

console.log('Successfully split globals.css');
console.log('Tokens lines:', tokens.length);
console.log('Glass lines:', glass.length);
console.log('Globals lines:', globals.length);
