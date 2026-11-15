import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));

  const requests = [];
  page.on('response', res => {
    const u = res.url();
    if (u.includes('supabase') || u.includes('/rest/v1/')) {
      requests.push({ status: res.status(), url: u });
    }
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const bannerText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('--- BODY BANNER ---');
  console.log(bannerText);

  console.log('\n--- CONSOLE LOGS ---');
  consoleLogs.forEach(c => console.log(`[${c.type.toUpperCase()}] ${c.text}`));

  console.log('\n--- SUPABASE CALLS ---');
  requests.forEach(r => console.log(`${r.status} ${r.url.slice(0, 110)}`));

  await browser.close();
})();
