import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  const networkRequests = [];
  page.on('response', response => {
    const url = response.url();
    if (url.includes('supabase') || url.includes('/api/')) {
      networkRequests.push({
        url,
        status: response.status(),
        statusText: response.statusText()
      });
    }
  });

  console.log('Navigating to https://le-loi-loop.vercel.app ...');
  try {
    await page.goto('https://le-loi-loop.vercel.app', { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.error('Goto error or timeout:', e.message);
  }

  await page.waitForTimeout(3000);

  const title = await page.title();
  console.log('Page Title:', title);

  console.log('\n--- CONSOLE LOGS ---');
  consoleLogs.forEach(c => console.log(`[${c.type.toUpperCase()}] ${c.text}`));

  console.log('\n--- SUPABASE / API REQUESTS ---');
  networkRequests.forEach(r => console.log(`${r.status} ${r.statusText} ${r.url}`));

  await page.screenshot({ path: 'qa_tests/probe_screenshot.png', fullPage: true });
  console.log('Saved screenshot to qa_tests/probe_screenshot.png');

  await browser.close();
})();
