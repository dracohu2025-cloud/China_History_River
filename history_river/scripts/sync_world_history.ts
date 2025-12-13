import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { WORLD_HISTORY } from '../data/worldHistory';

const { Client } = pg;

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DIRECT_URL = process.env.SUPABASE_DIRECT_URL; // Using direct URL for DDL

if (!SUPABASE_URL || !SERVICE_KEY || !DIRECT_URL) {
    console.error('Missing required env variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DIRECT_URL)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runMigration() {
    console.log('🔌 Connecting to database for schema migration...');
    const client = new Client({
        connectionString: DIRECT_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('📦 Checking/Adding "country" column to dynasties...');
        await client.query(`
            ALTER TABLE dynasties 
            ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'china';
        `);

        console.log('📦 Checking/Adding "country" column to historical_events...');
        await client.query(`
            ALTER TABLE historical_events 
            ADD COLUMN IF NOT EXISTS "country" text DEFAULT 'china';
        `);

        // Clean up any existing non-china data to avoid duplicates/stale data
        console.log('🧹 Cleaning up existing non-China data...');
        await client.query(`DELETE FROM dynasties WHERE country != 'china'`);
        await client.query(`DELETE FROM historical_events WHERE country != 'china'`);

        console.log('✅ Schema migration complete.');
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

async function syncData() {
    console.log('🚀 Starting data sync...');

    let dynastyCount = 0;
    let eventCount = 0;

    for (const [countryCode, data] of Object.entries(WORLD_HISTORY)) {
        console.log(`Processing ${countryCode}...`);

        // 1. Sync Dynasties
        console.log(`  - Syncing ${data.dynasties.length} dynasties...`);
        const dynastyRows = data.dynasties.map(d => ({
            id: d.id, // Assuming id is unique or we are generating new content. IDs like 'usa_colonial' are unique.
            name: d.name,
            chinese_name: d.chineseName,
            start_year: d.startYear,
            end_year: d.endYear,
            color: d.color,
            description: d.description,
            country: countryCode
        }));

        if (dynastyRows.length > 0) {
            const { error: dError } = await supabase.from('dynasties').insert(dynastyRows);
            if (dError) {
                console.error(`  ❌ Error inserting dynasties for ${countryCode}:`, dError);
            } else {
                dynastyCount += dynastyRows.length;
            }
        }

        // 2. Sync Events
        console.log(`  - Syncing ${data.events.length} events...`);
        const eventRows = data.events.map(e => ({
            year: e.year,
            title: e.title,
            event_type: e.type, // DB column is usually event_type
            importance: e.importance,
            description: e.description || '', // Ensure not null if required
            country: countryCode
        }));

        if (eventRows.length > 0) {
            const { error: eError } = await supabase.from('historical_events').insert(eventRows);
            if (eError) {
                console.error(`  ❌ Error inserting events for ${countryCode}:`, eError);
            } else {
                eventCount += eventRows.length;
            }
        }
    }

    console.log(`\n✨ Sync Complete!`);
    console.log(`   - Dynasties added: ${dynastyCount}`);
    console.log(`   - Events added: ${eventCount}`);
}

async function main() {
    await runMigration();
    await syncData();
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
