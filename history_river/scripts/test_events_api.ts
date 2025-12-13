import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testEventsFetch() {
    console.log("Testing fetchEvents('china')...");
    const { data, error } = await supabase
        .from('historical_events')
        .select('title, year, country')
        .eq('country', 'china')
        .limit(10); // Check a few

    if (error) {
        console.error("Fetch Error:", error);
    } else {
        console.log(`Fetch returned ${data.length} rows.`);
        console.log("Sample rows:", data);

        // Check for non-china
        const hasForeign = data.some(r => r.country !== 'china');
        if (hasForeign) {
            console.error("❌ API returned non-china row despite filter!");
        } else {
            console.log("✅ API respects filter.");
        }
    }

    console.log("\nTesting fetchEvents('usa')...");
    const res = await supabase
        .from('historical_events')
        .select('title, year, country')
        .eq('country', 'usa')
        .limit(5);
    console.log("USA Data:", res.data);
}

testEventsFetch();
