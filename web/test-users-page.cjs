const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await context.newPage();

    const errors = [];
    const consoleMessages = [];

    page.on('console', msg => {
        if (msg.type() === 'error') consoleMessages.push(`[ERROR] ${msg.text()}`);
    });
    page.on('pageerror', err => errors.push(err.message));

    try {
        // 1. Navigate to login
        console.log('1. Navigating to login page...');
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
        console.log('   Title:', await page.title());

        // 2. Login as admin
        console.log('2. Logging in as admin...');
        await page.fill('input[type="email"]', 'admin@bhedu.vn');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard**', { timeout: 15000 });
        console.log('   Redirected to:', page.url());

        // 3. Navigate to users page
        console.log('3. Navigating to /dashboard/users...');
        await page.goto('http://localhost:3000/dashboard/users', { waitUntil: 'networkidle', timeout: 15000 });
        console.log('   Title:', await page.title());

        // 4. Wait for table or empty state
        console.log('4. Waiting for content to load...');
        await page.waitForTimeout(5000);

        // 5. Check for visible users
        const userRows = await page.$$('table tbody tr');
        console.log(`   Found ${userRows.length} user rows in the table.`);

        // 6. Check for error alerts
        const alertEl = await page.$('[role="alert"]');
        if (alertEl) {
            const alertText = await alertEl.textContent();
            console.log('   ALERT found:', alertText);
        }

        // 7. Check statistics cards
        const statCards = await page.$$('.glass-card');
        console.log(`   Found ${statCards.length} stat cards.`);

        // 8. Check for encoding issues in the visible text
        const bodyText = await page.textContent('body');
        const encodingIssues = [];
        if (bodyText.includes('thềE')) encodingIssues.push('thềE (should be thể)');
        if (bodyText.includes('HềEthống')) encodingIssues.push('HềEthống (should be Hệ thống)');
        if (bodyText.includes('trềE')) encodingIssues.push('trềE (should be trị)');
        if (bodyText.includes('vĩnh viềE')) encodingIssues.push('vĩnh viềE (should be vĩnh viễn)');
        if (bodyText.includes('sềEđiện')) encodingIssues.push('sềEđiện (should be số điện)');

        if (encodingIssues.length > 0) {
            console.log('   ⚠️ ENCODING ISSUES FOUND:');
            encodingIssues.forEach(issue => console.log(`      - ${issue}`));
        } else {
            console.log('   ✅ No encoding issues detected in visible text.');
        }

        // 9. Take screenshot
        await page.screenshot({ path: 'users-page-screenshot.png', fullPage: true });
        console.log('   Screenshot saved to users-page-screenshot.png');

        // 10. Summary
        console.log('\n--- SUMMARY ---');
        console.log(`Users displayed: ${userRows.length}`);
        console.log(`Stat cards: ${statCards.length}`);
        console.log(`Console errors: ${consoleMessages.length}`);
        console.log(`Page errors: ${errors.length}`);
        console.log(`Encoding issues: ${encodingIssues.length}`);
        if (consoleMessages.length > 0) {
            console.log('\nConsole errors:');
            consoleMessages.forEach(m => console.log(`  ${m}`));
        }
        if (errors.length > 0) {
            console.log('\nPage errors:');
            errors.forEach(e => console.log(`  ${e}`));
        }

    } catch (err) {
        console.error('Test failed:', err.message);
        await page.screenshot({ path: 'users-page-error.png' }).catch(() => { });
    } finally {
        await browser.close();
    }
})();
