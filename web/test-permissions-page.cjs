const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const apiErrors = [];

    page.on('response', res => {
        if (res.status() >= 400 && res.url().includes('/api/')) {
            apiErrors.push(`${res.status()} ${res.url().split('/api/')[1]?.substring(0, 80)}`);
        }
    });

    try {
        // Login
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
        await page.fill('input[type="email"]', 'admin@bhedu.vn');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 15000 });

        // Navigate to permissions
        await page.goto('http://localhost:3000/dashboard/admin/permissions', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(5000);

        // Count users in sidebar
        const userBtns = await page.$$('.space-y-2 button');
        console.log('Users in sidebar:', userBtns.length);

        // Click first user
        if (userBtns.length > 0) {
            await userBtns[0].click();
            console.log('Clicked first user');
            await page.waitForTimeout(3000);

            // Check what's in the right panel
            const rightPanel = await page.$('.lg\\:col-span-2');
            if (rightPanel) {
                const text = await rightPanel.textContent();
                const hasPermCategories = text.includes('quyền');
                const hasLoading = text.includes('Đang tải');
                const hasError = text.includes('Error') || text.includes('lỗi');
                console.log('Right panel content checks:');
                console.log('  Has permission references:', hasPermCategories);
                console.log('  Still loading:', hasLoading);
                console.log('  Has errors:', hasError);
                console.log('  Text sample:', text.substring(0, 300));
            }
        }

        await page.screenshot({ path: 'permissions-click-screenshot.png', fullPage: true });
        console.log('\nAPI errors:', apiErrors.length);
        apiErrors.forEach(e => console.log(' ', e));

    } catch (err) {
        console.error('Test failed:', err.message);
        await page.screenshot({ path: 'permissions-click-error.png' }).catch(() => { });
    } finally { await browser.close(); }
})();
