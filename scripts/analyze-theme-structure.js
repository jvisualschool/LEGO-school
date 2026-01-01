const apiKey = 'REBRICKABLE_API_KEY';

async function analyzeThemes() {
    let url = `https://rebrickable.com/api/v3/lego/themes/?page_size=1000&key=${apiKey}`;
    let allThemes = [];

    try {
        while (url) {
            const res = await fetch(url);
            const data = await res.json();
            allThemes = allThemes.concat(data.results);
            url = data.next;
        }

        const rootThemes = allThemes.filter(t => t.parent_id === null);
        const subThemes = allThemes.filter(t => t.parent_id !== null);

        console.log(`Total themes: ${allThemes.length}`);
        console.log(`Root themes: ${rootThemes.length}`);
        console.log(`Sub themes: ${subThemes.length}`);

        // Create a map for easy lookup
        const themeMap = new Map();
        allThemes.forEach(t => themeMap.set(t.id, t.name));

        // Show some examples of hierarchies
        console.log('\n--- Examples of Sub-themes ---');

        // Find children of 'Star Wars' (ID 158)
        const starWarsChildren = subThemes.filter(t => t.parent_id === 158);
        console.log(`\n[Star Wars] has ${starWarsChildren.length} sub-themes, including:`);
        starWarsChildren.slice(0, 5).forEach(c => console.log(`  - ${c.name}`));

        // Find children of 'City' (ID 52)
        const cityChildren = subThemes.filter(t => t.parent_id === 52);
        console.log(`\n[City] has ${cityChildren.length} sub-themes, including:`);
        cityChildren.slice(0, 5).forEach(c => console.log(`  - ${c.name}`));

        // Find children of 'Technic' (ID 1)
        const technicChildren = subThemes.filter(t => t.parent_id === 1);
        console.log(`\n[Technic] has ${technicChildren.length} sub-themes, including:`);
        technicChildren.slice(0, 5).forEach(c => console.log(`  - ${c.name}`));

    } catch (err) {
        console.error('Error:', err);
    }
}

analyzeThemes();
