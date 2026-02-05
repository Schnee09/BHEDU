const { exec } = require('child_process');
const fs = require('fs');

console.log("Running tsc...");
exec('npx tsc --noEmit', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
    const output = stdout + stderr;
    fs.writeFileSync('build-log.txt', output);
    console.log("tsc finished. Exit code:", error ? error.code : 0);
    if (error) {
        console.log("Errors written to build-log.txt");
        process.exit(1);
    } else {
        console.log("Build successful!");
        process.exit(0);
    }
});
