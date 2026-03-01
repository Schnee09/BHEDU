const { chromium } = require('playwright');

(async () => {
    console.log('Launching browser...');
    try {
        const browser = await chromium.launch({ headless: true });
        console.log('Browser launched!');
        const context = await browser.newContext();
        const page = await context.newPage();
        console.log('Navigating to example.com...');
        await page.goto('https://example.com');
        console.log('Title:', await page.title());
        await browser.close();
        console.log('Success!');
    } catch (e) {
        console.error('Failed:', e);
    }
})();
