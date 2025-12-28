const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

(async () => {
  try {
    const possible = [
      process.env.OPERA_PATH || '',
      'C:\\Program Files\\Opera\\launcher.exe',
      'C:\\Program Files (x86)\\Opera\\launcher.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Opera', 'launcher.exe'),
      path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', 'Opera', 'launcher.exe')
    ].filter(p => p && p.length);

    console.log('Trying Opera paths (including OPERA_PATH env if set):');
    possible.forEach(p => console.log(' -', p));

    const found = possible.find(p => fs.existsSync(p));
    if (!found) {
      console.log('\nOpera not found in common locations.');
      process.exitCode = 2;
      return;
    }

    console.log('\nFound Opera at:', found);
    console.log('Launching Opera (headed) via Playwright.chromium...');

    const browser = await playwright.chromium.launch({ executablePath: found, headless: false, args: ['--no-sandbox'] });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    const url = process.env.TEST_URL || 'http://localhost:3000/login';
    console.log('Navigating to', url);
    await page.goto(url, { waitUntil: 'networkidle' }).catch(() => {});

    // create a filesystem-safe filename from the URL
    const safeName = url.replace(/https?:\/\//, '').replace(/[:?#]/g, '').replace(/[\\/]+/g, '_');
    const screenshotPath = path.join(process.cwd(), `.playwright-opera-${safeName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Saved screenshot to', screenshotPath);

    // keep window open briefly so user can see it
    await new Promise(resolve => setTimeout(resolve, 1500));

    await browser.close();
    console.log('Browser closed.');
    process.exitCode = 0;
  } catch (err) {
    console.error('Error:', err);
    process.exitCode = 1;
  }
})();
