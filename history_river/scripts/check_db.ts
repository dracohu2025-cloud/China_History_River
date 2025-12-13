import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

const { Client } = pg;
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    console.log('--- Dynasties by Country ---');
    const res = await client.query('SELECT country, COUNT(*) FROM dynasties GROUP BY country');
    console.table(res.rows);

    console.log('\n--- Events by Country ---');
    const res2 = await client.query('SELECT country, COUNT(*) FROM historical_events GROUP BY country');
    console.table(res2.rows);

    await client.end();
}

run();
