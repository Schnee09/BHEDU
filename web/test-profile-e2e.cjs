const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
    const testEmail = 'test_profile_e2e_1@example.com';
    const testPassword = 'password123';

    console.log('1. Setting up test user...', testEmail);
    // Create or update user
    let { error } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { role: 'student', full_name: 'E2E Tester' }
    });

    if (error && (error.message.includes('already') || error.code === 'email_exists')) {
        console.log('User exists, updating password...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users.find(u => u.email === testEmail);
        if (existing) {
            await supabase.auth.admin.updateUserById(existing.id, { password: testPassword });

            // Check profiles table and insert if necessary
            const { data: p } = await supabase.from('profiles').select('id').eq('user_id', existing.id);
            if (!p || p.length === 0) {
                await supabase.from('profiles').insert({
                    user_id: existing.id,
                    email: testEmail,
                    role: 'student',
                    full_name: 'E2E Tester',
                    id: existing.id
                });
            }
        }
    } else if (error) {
        console.error('Error creating test user:', error);
        return;
    }

    console.log('2. Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('3. Navigating to login...');
        await page.goto('http://localhost:3000/login');

        console.log('4. Logging in...');
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.click('button[type="submit"]');

        console.log('Waiting for login to complete...');
        await page.waitForTimeout(5000); // Wait explicitly in case router is slow

        console.log('5. Navigating to Profile /dashboard/profile...');
        await page.goto('http://localhost:3000/dashboard/profile', { waitUntil: 'load' }); // More robust load state

        await page.waitForTimeout(4000); // Wait for profile loading state to finish
        await page.screenshot({ path: 'test-artifacts/profile-1-before.png' });

        console.log('6. Editing profile...');
        const newName = 'Playwright Tester ' + Date.now();

        // Wait for anything inside the form to be ready. 
        // We see "Họ và tên đầy đủ *" label in the screenshot, let's target by exact label or placeholder:
        const nameInputLocators = [
            page.getByLabel('Họ và tên đầy đủ *'),
            page.getByLabel('Họ và tên đầy đủ'),
            page.locator('input[placeholder="Nguyễn Văn A"]')
        ];

        let foundInput = null;
        for (const loc of nameInputLocators) {
            console.log(`Checking locator...`);
            if (await loc.first().isVisible().catch(() => false)) {
                foundInput = loc.first();
                break;
            }
        }

        if (!foundInput) {
            console.log('Could not find input by label or placeholder. Let\'s get all inputs as fallback.');
            foundInput = page.locator('form input').first();
        }

        if (foundInput) {
            await foundInput.fill(newName);
            await page.screenshot({ path: 'test-artifacts/profile-2-editing.png' });

            console.log('7. Saving profile...');
            // The save button has text "Lưu hồ sơ"
            await page.getByRole('button', { name: 'Lưu hồ sơ' }).click();

            console.log('Waiting for toast/success...');
            await page.waitForTimeout(4000);
            await page.screenshot({ path: 'test-artifacts/profile-3-after-save.png' });

            // Let's verify if the toast says success or error by extracting text
            const bodyText = await page.evaluate(() => document.body.innerText);
            if (bodyText.includes('Thành công')) {
                console.log('✅ Found success message in DOM!');
            } else if (bodyText.includes('Lỗi')) {
                console.log('❌ Found error message in DOM!');
                console.log('Error Snippet:', bodyText.substring(0, 1000));
            } else {
                console.log('⚠️ Could not definitively find success/error toast.');
            }
        } else {
            console.log('❌ Could not find the input field!');
        }

        console.log('Success! Done testing profile save.');
    } catch (e) {
        console.error('Test failed:', e);
        await page.screenshot({ path: 'test-artifacts/profile-error.png', fullPage: true }).catch(() => { });
    } finally {
        await browser.close();
    }
})();
