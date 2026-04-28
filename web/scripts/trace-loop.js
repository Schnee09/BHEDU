const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const consoleLogs = [];
    page.on('console', msg => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    const urls = [];
    page.on('response', response => {
        urls.push(`${response.status()} ${response.url()}`);
    });

    try {
        console.log('Navigating to /login');
        await page.goto('http://localhost:3000/login');
        await page.waitForTimeout(5000); // Wait 5 seconds to observe any looping behavior
    } catch (err) {
        console.error('Error navigating to login:', err);
    }

    try {
        console.log('Navigating to /dashboard');
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForTimeout(5000); // Wait 5 seconds to observe any looping behavior
    } catch (err) {
        console.error('Error navigating to dashboard:', err);
    }

    fs.writeFileSync('browser_logs.txt', consoleLogs.join('\n'));
    fs.writeFileSync('network_trace.txt', urls.join('\n'));
    console.log('Saved browser_logs.txt and network_trace.txt');

    await browser.close();
})();
