const fs = require('fs');
const { execSync } = require('child_process');

try {
    const content = fs.readFileSync('git_status_output.txt', 'utf16le');
    const lines = content.split('\n');
    const filesToStage = [];

    for (const line of lines) {
        if (line.startsWith(' M ') || line.startsWith('M ') || line.startsWith('?? supabase/migrations')) {
            const file = line.substring(3).trim(); // Skip the "XY " status prefix

            // I only want to stage specific files discussed in the plan
            if (
                file.includes('names.ts') ||
                file.includes('common.ts') ||
                file.includes('index.ts') ||
                file.includes('permissions') ||
                file.includes('remove_sync_full_name.sql')
            ) {
                filesToStage.push(file);
            }
        }
    }

    console.log('Files to stage:', filesToStage);
    if (filesToStage.length > 0) {
        // Quote files in case they have spaces
        const quotedFiles = filesToStage.map(f => `"${f}"`).join(' ');
        execSync(`git add ${quotedFiles}`);
        console.log('Staged successfully.');
    } else {
        console.log('No matching files found to stage.');
    }
} catch (e) {
    console.error(e);
}
