const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const apiErrors = [];
    const consoleErrors = [];

    page.on('response', res => {
        if (res.status() >= 400 && res.url().includes('/api/')) {
            apiErrors.push(`${res.status()} ${res.url().split('/api/')[1]?.substring(0, 100)}`);
        }
    });
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 150));
    });
    page.on('pageerror', err => consoleErrors.push('PAGE_ERROR: ' + err.message.substring(0, 150)));

    try {
        // Login
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
        await page.fill('input[type="email"]', 'admin@bhedu.vn');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 15000 });
        console.log('Logged in successfully\n');

        const pages = [
            { name: 'Attendance Main', path: '/dashboard/attendance' },
            { name: 'Mark Attendance', path: '/dashboard/attendance/mark' },
            { name: 'Attendance History', path: '/dashboard/attendance/history' },
            { name: 'Attendance Reports', path: '/dashboard/attendance/reports' },
        ];

        for (const p of pages) {
            apiErrors.length = 0;
            console.log(`=== ${p.name} (${p.path}) ===`);

            await page.goto(`http://localhost:3000${p.path}`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(3000);

            const bodyText = await page.textContent('body');

            // Check for common error states
            const hasUnauthorized = bodyText.includes('Không có quyền') || bodyText.includes('Unauthorized');
            const hasNotFound = bodyText.includes('404') || bodyText.includes('not found');
            const hasError = bodyText.includes('Lỗi') || bodyText.includes('Error fetching');
            const hasLoading = bodyText.includes('Đang tải');

            if (hasUnauthorized) console.log('  ⚠️ UNAUTHORIZED');
            if (hasNotFound) console.log('  ⚠️ 404 NOT FOUND');
            if (hasError) console.log('  ⚠️ ERROR state detected');
            if (hasLoading) console.log('  ⏳ Still loading...');
            if (!hasUnauthorized && !hasNotFound && !hasError && !hasLoading) console.log('  ✅ Page loaded OK');

            if (apiErrors.length > 0) {
                console.log(`  API errors (${apiErrors.length}):`);
                apiErrors.forEach(e => console.log(`    ${e}`));
            }

            // Take screenshot
            const screenshotName = `attendance-${p.path.split('/').pop()}-screenshot.png`;
            await page.screenshot({ path: screenshotName, fullPage: true });
            console.log(`  Screenshot: ${screenshotName}`);
            console.log('');
        }

        // Summary
        console.log('=== OVERALL SUMMARY ===');
        console.log(`Console errors: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            consoleErrors.slice(0, 5).forEach(e => console.log(`  ${e}`));
        }

    } catch (err) {
        console.error('Test failed:', err.message);
        await page.screenshot({ path: 'attendance-error.png' }).catch(() => { });
    } finally { await browser.close(); }
})();
