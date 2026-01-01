const apiKey = 'REBRICKABLE_API_KEY';

async function checkTotalThemes() {
    let url = `https://rebrickable.com/api/v3/lego/themes/?page_size=1000&key=${apiKey}`;
    let allThemes = [];

    try {
        while (url) {
            console.log(`Fetching themes from ${url}...`);
            const res = await fetch(url);
            const data = await res.json();
            allThemes = allThemes.concat(data.results);
            url = data.next;
        }

        const rootThemes = allThemes.filter(t => t.parent_id === null);
        console.log(`\nTotal themes fetched: ${allThemes.length}`);
        console.log(`Total ROOT themes (no parent_id): ${rootThemes.length}`);

        // List some differences if any (active comparison logic could go here)
        // For now just printing the count to answer the user.

    } catch (err) {
        console.error('Error:', err);
    }
}

checkTotalThemes();
