const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFull() {
    const { data, error } = await supabase
        .from('classes')
        .select(`
            id, name, course_id,
            courses (id, name, code),
            teacher:profiles!teacher_id (id, full_name, subject_id, subjects (id, name, code))
        `)
        .limit(5);

    if (error) {
        console.error("Error:", JSON.stringify(error));
        return;
    }

    // Write the full output to a file since console is truncated
    fs.writeFileSync('./debug-output.json', JSON.stringify(data, null, 2));
    console.log("Written to debug-output.json");
}

checkFull();
