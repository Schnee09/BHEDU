const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)/);
    if (match) env[match[1]] = match[2];
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    const { data, error } = await supabase
        .from('classes')
        .select(`
            id, name, course_id,
            courses (id, name, code)
        `)
        .limit(5);

    console.log("Error:", error);
    console.log("Classes:", JSON.stringify(data, null, 2));
}

checkData();
