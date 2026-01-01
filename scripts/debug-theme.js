const apiKey = 'REBRICKABLE_API_KEY';

// Classic theme ID: 621
// Let's check why it returned 0
async function debugClassic() {
    const headers = {
        'Authorization': `key ${apiKey}`
    }
    // Standard call
    const url = `https://rebrickable.com/api/v3/lego/sets/?theme_id=621&page_size=1&key=${apiKey}`;
    console.log(`Fetching ${url}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(`Data count: ${data.count}`);
        if (data.results && data.results.length > 0) {
            console.log('Sample set:', data.results[0].name);
        }
    } catch (e) {
        console.error(e);
    }
}

debugClassic();
