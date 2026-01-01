import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '../public/new-sets.json');

async function fetchNewSets() {
    console.log('🚀 Starting LEGO New Sets scraper...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        // Set user agent to avoid blocking
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.goto('https://www.lego.com/ko-kr/categories/new-sets-and-products', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Scroll to bottom to ensure lazy-loaded images are loaded
        await autoScroll(page);

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('article[data-test="product-leaf"]');
            return Array.from(items).map(el => {
                const nameEl = el.querySelector('[data-test="product-leaf-title"]');
                const priceEl = el.querySelector('[data-test="product-leaf-price"]');
                const piecesEl = el.querySelector('[data-test="product-leaf-piece-count-label"]');
                const imgEl = el.querySelector('img[data-test*="product-leaf-image"]');
                const actionEl = el.querySelector('[data-test="product-leaf-action-row"]');
                const badgeEl = el.querySelector('[data-test="product-leaf-badge"]');

                // Try multiple selectors for the link as they frequently change
                const linkEl = el.querySelector('a[data-test="product-leaf-title"]') ||
                    el.querySelector('a[data-test="product-leaf-image-link"]') ||
                    el.querySelector('a[href*="/product/"]');

                const href = linkEl ? linkEl.getAttribute('href') : null;

                return {
                    name: nameEl ? nameEl.innerText.trim() : 'Unknown Name',
                    price: priceEl ? priceEl.innerText.trim() : 'N/A',
                    pieces: piecesEl ? piecesEl.innerText.trim() : null,
                    image: imgEl ? imgEl.src : null,
                    status: actionEl ? actionEl.innerText.trim() : '',
                    badge: badgeEl ? badgeEl.innerText.trim() : null,
                    url: href ? (href.startsWith('http') ? href : 'https://www.lego.com' + href) : null,
                    isComingSoon: actionEl ? (actionEl.innerText.includes('출시 예정') || actionEl.innerText.includes('Coming Soon')) : false
                };
            });
        });

        const data = {
            lastUpdated: new Date().toISOString(),
            count: products.length,
            items: products
        };

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
        console.log(`✅ Successfully saved ${products.length} sets to ${OUTPUT_PATH}`);

    } catch (error) {
        console.error('❌ Error during scraping:', error);
    } finally {
        await browser.close();
    }
}

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}

fetchNewSets();
