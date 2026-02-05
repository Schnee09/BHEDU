import { Client } from "pg";
import * as dotenv from "dotenv";
import path from "path";

// Load env from web/.env and web/.env.local (since we are in web directory usually, or root)
// script is in web/scripts, so .env are in web/
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const dbUrl = process.env.DATABASE_URL;

async function migrate() {
    if (!dbUrl) {
        console.error(
            "❌ DATABASE_URL not found in environment variables. Cannot apply migration.",
        );
        // Try to construct from separate vars if available?
        // SUPABASE_DB_URL?
        console.log("Env keys:", Object.keys(process.env));
        process.exit(1);
    }

    console.log("Connecting to database...");
    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }, // Supabase requires SSL, usually self-signed or CA irrelevant for this patch
    });

    try {
        await client.connect();
        console.log("Connected. Applying patch...");

        await client.query(`
            ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 1;
            ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        `);

        console.log(
            "✅ Successfully added 'credits' and 'is_active' columns to 'subjects' table.",
        );
    } catch (e: any) {
        console.error("❌ Migration failed:", e.message);
    } finally {
        await client.end();
    }
}

migrate();
