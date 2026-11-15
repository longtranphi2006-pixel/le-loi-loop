import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();
  await page.goto('https://le-loi-loop.vercel.app');
  
  const envCheck = await page.evaluate(() => {
    return {
      title: document.title,
      // Let's check banner text
      banner: document.body.innerText.slice(0, 300)
    };
  });
  console.log('Result:', envCheck);
  await browser.close();
})();
