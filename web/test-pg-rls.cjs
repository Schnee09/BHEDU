require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkRLS() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();

        const uid = '1be48ae2-3e35-490b-9840-059330b85f1a';

        // Switch to authenticated role and set JWT claims
        await client.query(`SET ROLE authenticated;`);
        await client.query(`SET request.jwt.claims TO '{"sub": "${uid}", "role": "authenticated"}';`);

        // Check if we can SELECT the profile
        console.log('--- Testing SELECT ---');
        const selectRes = await client.query(`SELECT id, role, full_name FROM profiles WHERE id = $1;`, [uid]);
        console.log('SELECT result rows:', selectRes.rowCount);
        if (selectRes.rowCount > 0) {
            console.dir(selectRes.rows[0]);
        }

        // Try UPDATE
        console.log('\n--- Testing UPDATE ---');
        const newName = 'Quản Trị Viên PG ' + Math.floor(Math.random() * 1000);
        const updateRes = await client.query(`
      UPDATE profiles 
      SET full_name = $1, updated_at = NOW() 
      WHERE id = $2 
      RETURNING id, full_name;
    `, [newName, uid]);

        console.log('UPDATE result rows:', updateRes.rowCount);
        if (updateRes.rowCount > 0) {
            console.dir(updateRes.rows[0]);
        } else {
            console.log('UPDATE returned 0 rows! RLS might be blocking it.');

            // Try to find out WHY by checking policies
            console.log('\n--- Checking Policy Expressions ---');
            await client.query(`RESET ROLE;`);

            const policies = await client.query(`
        SELECT polname, polcmd, polqual, polwithcheck 
        FROM pg_policy 
        WHERE polrelid = 'profiles'::regclass;
      `);
            console.log('Policies on profiles table:');
            policies.rows.forEach(p => console.dir(p));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkRLS();
