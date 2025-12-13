import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkPollution() {
    console.log("Checking for foreign events labeled as 'china'...");

    const foreignTitles = ['Battle of Waterloo', 'Meiji Restoration', 'Independence Day', 'Magna Carta'];

    const { data, error } = await supabase
        .from('historical_events')
        .select('*')
        .eq('country', 'china')
        .in('title', foreignTitles);

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found suspicious 'china' events:", data);
        if (data && data.length > 0) {
            console.log("CONFIRMED: Database pollution detected. Foreign events are labeled as 'china'.");
        } else {
            console.log("CLEAN: No foreign events found in 'china' dataset.");
        }
    }
}

checkPollution();
