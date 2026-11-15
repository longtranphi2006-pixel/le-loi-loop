import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('https://le-loi-loop.vercel.app', { waitUntil: 'networkidle' });

  // Initial items in localStorage
  const init = await page.evaluate(() => localStorage.getItem('LE_LOI_LOOP_V1_ITEMS'));
  console.log('Initial items in localStorage:', init ? JSON.parse(init).length : 'none');

  // Select HS001
  await page.locator('button:has-text("HS001")').first().click();
  await page.waitForTimeout(500);

  // Click Đăng đồ
  await page.locator('header nav button:has-text("Đăng đồ")').click();
  await page.waitForTimeout(500);

  // Fill form
  await page.locator('form input[type="text"]').first().fill('[TEST-QA] Sách Vật Lý 8');
  await page.locator('form select').first().selectOption('sgk');
  await page.locator('form select').nth(1).selectOption('Tốt');
  const slotBtn = page.locator('form button:has-text("Thứ 2 - Chiều"), form button:has-text("T2 - Chiều")').first();
  if (await slotBtn.isVisible()) await slotBtn.click();
  await page.locator('form textarea').first().fill('Test mô tả');

  // Submit
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1000);

  const afterAdd = await page.evaluate(() => localStorage.getItem('LE_LOI_LOOP_V1_ITEMS'));
  console.log('After add items:', afterAdd ? JSON.parse(afterAdd).length : 'none');

  // Reload page (F5)
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const afterReload = await page.evaluate(() => localStorage.getItem('LE_LOI_LOOP_V1_ITEMS'));
  console.log('After reload items:', afterReload ? JSON.parse(afterReload).length : 'none');
  if (afterReload) {
    const list = JSON.parse(afterReload);
    console.log('Top item:', list[0]?.id, list[0]?.title, list[0]?.status);
  }

  // Go to Admin Tab A
  await page.locator('button:has-text("GV01")').first().click();
  await page.waitForTimeout(500);
  await page.locator('header nav button:has-text("Quản lý")').click();
  await page.waitForTimeout(1000);

  const adminText = await page.innerText('main');
  console.log('Admin contains [TEST-QA]?', adminText.includes('[TEST-QA] Sách Vật Lý 8'));

  await browser.close();
}

test();
