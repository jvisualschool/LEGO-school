// Script to fetch and cache all theme data with images (including from child themes)
import fs from 'fs';

const API_KEY = process.env.REBRICKABLE_API_KEY || '';

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.status === 429) {
                console.log('Rate limited, waiting...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                continue;
            }
            return await response.json();
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function fetchThemes() {
    console.log('Fetching all themes...');
    const data = await fetchWithRetry(`https://rebrickable.com/api/v3/lego/themes/?page_size=1000&key=${API_KEY}`);

    if (!data.results) {
        console.error('No results in response:', data);
        return;
    }

    const allThemes = data.results;
    const parentThemes = allThemes.filter(t => !t.parent_id && t.name).sort((a, b) => a.name.localeCompare(b.name));
    console.log(`Found ${parentThemes.length} parent themes`);

    const themesWithImages = [];

    for (let i = 0; i < parentThemes.length; i++) {
        const theme = parentThemes[i];
        process.stdout.write(`\r[${i + 1}/${parentThemes.length}] ${theme.name.padEnd(25)}...`);

        let imgUrl = null;

        try {
            // First try: Get set from this theme directly
            let setData = await fetchWithRetry(`https://rebrickable.com/api/v3/lego/sets/?theme_id=${theme.id}&page_size=1&ordering=-num_parts&key=${API_KEY}`);

            if (setData.results && setData.results[0] && setData.results[0].set_img_url) {
                imgUrl = setData.results[0].set_img_url;
            } else {
                // Second try: Find child themes and get set from them
                const childThemes = allThemes.filter(t => t.parent_id === theme.id);

                for (const child of childThemes) {
                    setData = await fetchWithRetry(`https://rebrickable.com/api/v3/lego/sets/?theme_id=${child.id}&page_size=1&ordering=-num_parts&key=${API_KEY}`);
                    if (setData.results && setData.results[0] && setData.results[0].set_img_url) {
                        imgUrl = setData.results[0].set_img_url;
                        break;
                    }
                    await new Promise(resolve => setTimeout(resolve, 30));
                }
            }

            themesWithImages.push({
                id: theme.id,
                name: theme.name,
                img_url: imgUrl
            });

            await new Promise(resolve => setTimeout(resolve, 50));
        } catch (e) {
            console.error(`\nError fetching ${theme.name}:`, e.message);
            themesWithImages.push({
                id: theme.id,
                name: theme.name,
                img_url: null
            });
        }
    }

    const outputPath = './public/themes-cache.json';
    fs.writeFileSync(outputPath, JSON.stringify({
        updated: new Date().toISOString(),
        count: themesWithImages.length,
        withImages: themesWithImages.filter(t => t.img_url).length,
        themes: themesWithImages
    }, null, 2));

    const withImg = themesWithImages.filter(t => t.img_url).length;
    console.log(`\n\n✅ Saved ${themesWithImages.length} themes (${withImg} with images) to ${outputPath}`);
}

fetchThemes().catch(console.error);
