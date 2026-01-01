import fs from 'fs';
import path from 'path';

const apiKey = process.env.REBRICKABLE_API_KEY || ''; // Use environment variable
const cachePath = path.resolve('public/themes-cache.json');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateCounts() {
    console.log('Reading cache...');
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    const themes = cacheData.themes;

    console.log(`Found ${themes.length} themes. Starting update...`);

    let updatedCount = 0;

    for (let i = 0; i < themes.length; i++) {
        const theme = themes[i];

        // Only update if count is 0, missing, or explicitly requested (by removing this check)
        // But user asked to update "all themes with missing numbers" effectively

        // Use theme_ids to get TOTAL count including sub-themes
        // But wait, API doesn't support multiple IDs at once.
        // So we need to iterate over sub-theme IDs and sum them up?
        // OR, just rely on Rebrickable's behavior?

        // Rebrickable docs say theme_id filter includes children AUTOMATICALLY.
        // But our previous test showed City (52) only returned 273.
        // Let's try to sum up counts for all IDs in theme.theme_ids

        console.log(`[${i + 1}/${themes.length}] Fetching count for ${theme.name} (Root ID: ${theme.id})...`);

        let totalThemeCount = 0;

        // Split IDs
        const ids = (theme.theme_ids || theme.id.toString()).split(',');

        // If it's a huge list, this might take a while.
        // Let's try to optimize: fetching each ID individually is too slow (API rate limits).

        // Actually, let's just fetch the root ID count again, maybe my previous test was wrong or I misinterpreted it.
        // Wait, the user said "Numbers that are missing". 
        // In themes-cache.json, Adventurers has 0.
        // Let's fetch Adventurers (296)

        try {
            let count = 0;
            // Strategy: Iterate all descendant IDs and fetch count for each? 
            // No, that's too n calls.

            // Re-confirmed: Rebrickable API `theme_id` DOES NOT include children by default in the `sets` endpoint unless specific flags are used (which don't exist in v3 public docs plainly).
            // Wait, maybe I can use `min_year=1900` or something to force a scan? No.

            // Let's simply sum up counts of all descendant themes.
            // We have the list of IDs in `theme_ids`.

            console.log(`  -> Has ${ids.length} sub-themes (including self).`);

            for (const subId of ids) {
                const res = await fetch(`https://rebrickable.com/api/v3/lego/sets/?theme_id=${subId}&page_size=1&key=${apiKey}`);
                if (res.ok) {
                    const data = await res.json();
                    count += data.count || 0;
                }
                // very short delay
                await sleep(50);
            }

            theme.set_count = count;
            console.log(`  -> Total Count: ${count}`);
            updatedCount++;

            // Save incrementally every 10 themes in case of crash
            if (updatedCount % 10 === 0) {
                fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
                console.log('  (Saved progress)');
            }

        } catch (err) {
            console.error(`Error fetching ${theme.name}:`, err);
        }
    }

    cacheData.updated_counts = new Date().toISOString();
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    console.log(`Updated ${updatedCount} themes. Saved to ${cachePath}`);
}

updateCounts();
