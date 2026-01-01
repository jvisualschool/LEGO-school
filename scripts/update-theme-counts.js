import fs from 'fs';
import path from 'path';

const apiKey = 'REBRICKABLE_API_KEY'; // Using the key from main.js
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
        console.log(`[${i + 1}/${themes.length}] Fetching count for ${theme.name} (ID: ${theme.id})...`);

        try {
            const res = await fetch(`https://rebrickable.com/api/v3/lego/sets/?theme_id=${theme.id}&page_size=1&key=${apiKey}`);
            if (!res.ok) {
                console.error(`Failed to fetch for ${theme.name}: ${res.status} ${res.statusText}`);
                continue;
            }
            const data = await res.json();
            const count = data.count || 0;

            theme.set_count = count;
            console.log(`  -> Count: ${count}`);
            updatedCount++;

        } catch (err) {
            console.error(`Error fetching ${theme.name}:`, err);
        }

        // Small delay to be nice to API
        await sleep(200);
    }

    cacheData.updated_counts = new Date().toISOString();
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    console.log(`Updated ${updatedCount} themes. Saved to ${cachePath}`);
}

updateCounts();
