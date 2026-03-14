require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function run() {
    const connectionString = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to DB');

        const sql = `
      CREATE OR REPLACE FUNCTION public.get_current_user_role()
      RETURNS text AS $$
      DECLARE
        var_role text;
      BEGIN
        SELECT role INTO var_role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
        RETURN var_role;
      END;
      $$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
    `;

        await client.query(sql);
        console.log('Function get_current_user_role updated successfully!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
