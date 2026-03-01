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

async function checkData() {
    const { data: courses, error } = await supabase
        .from('courses')
        .select(`*`)
        .limit(1);

    console.log("Error:", error);
    console.log("Course:", JSON.stringify(courses, null, 2));

    const { data: classes, error: err2 } = await supabase
        .from('classes')
        .select(`id, name, course_id, courses(*)`)
        .eq('name', 'test')
        .limit(1);

    console.log("Class Error:", err2);
    console.log("Test Class:", JSON.stringify(classes, null, 2));
}

checkData();
