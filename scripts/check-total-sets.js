const apiKey = 'REBRICKABLE_API_KEY';

async function checkTotalSets() {
    const url = `https://rebrickable.com/api/v3/lego/sets/?page_size=1&key=${apiKey}`;

    try {
        console.log('Fetching total sets count...');
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Total sets reported by API: ${data.count}`);

        const target = 25979;
        if (data.count === target) {
            console.log('Yes, it matches perfectly!');
        } else {
            console.log(`No, it's different. Difference: ${data.count - target}`);
        }
    } catch (err) {
        console.error('Error fetching sets:', err);
    }
}

checkTotalSets();
