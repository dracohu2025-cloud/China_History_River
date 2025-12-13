import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testFetch() {
    console.log("Testing fetch with country='china'...");
    const { data: chinaData, error: chinaError } = await supabase
        .from('dynasties')
        .select('*')
        .eq('country', 'china');

    if (chinaError) {
        console.error("China Fetch Error:", chinaError);
    } else {
        console.log(`Fetch 'china' returned ${chinaData.length} rows.`);
        if (chinaData.length > 0) {
            console.log("Sample Row:", JSON.stringify(chinaData[0]));
            // Check if 'country' field exists in response
            if (!('country' in chinaData[0])) {
                console.error("CRITICAL: 'country' field is MISSING in Supabase API response!");
            }
        }
    }

    // Also test explicitly selecting country
    console.log("\nTesting select specific column 'id, name, country'...");
    const { data: colData, error: colError } = await supabase
        .from('dynasties')
        .select('id, name, country')
        .limit(5);

    if (colError) {
        console.error("Column selection error (likely column unknown):", colError);
    } else {
        console.log("Column selection data:", colData);
    }
}

testFetch();
