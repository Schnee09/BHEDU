const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseAnon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAdminUpdate() {
    const testEmail = 'test_admin_rls@example.com';
    const testPassword = 'password123';

    console.log('1. Fetch test admin user uid...');
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let uid = users.find(u => u.email === testEmail)?.id;

    console.log('2. Logging in as test admin...');
    const { data: { session }, error: loginErr } = await supabaseAnon.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
    });

    if (loginErr) {
        console.error('Login failed:', loginErr);
        return;
    }

    // Create a client with the user's JWT
    const supabaseUser = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } }
    });

    console.log('3. Attempting to update profile as the admin user with precise payload...');
    const payload = {
        full_name: ' Quản Trị Viê',
        first_name: 'Viê',
        last_name: 'Quản Trị',
        phone: '0909090909',
        address: '',
        date_of_birth: '2026-02-05',
        personal_email: null,
        user_id: uid,
        updated_at: new Date().toISOString()
    };

    console.dir(payload);

    const { data, error } = await supabaseUser.from('profiles').update(payload).eq('id', uid).select();

    console.log('Update result:');
    console.dir({ data, error }, { depth: null });
}

testAdminUpdate().catch(console.error);
