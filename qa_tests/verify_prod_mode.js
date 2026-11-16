import { chromium } from 'playwright';

async function verifyProductionMode() {
  console.log('🚀 Starting Production Mode Verification...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Visit as Guest
  console.log('1. Testing Guest Mode (Unauthenticated)...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });

  // Check Role Switcher is absent
  const roleSwitcher = await page.$('text=Chế độ Demo / KHKT');
  const hs001Chip = await page.$('button:has-text("HS001")');
  console.log('Role Switcher present?', !!roleSwitcher || !!hs001Chip);
  if (roleSwitcher || hs001Chip) {
    throw new Error('FAILED: Role switcher or demo chips still found on screen!');
  }

  // Check Navbar items for Guest
  const loginBtn = await page.$('header button:has-text("Đăng nhập")');
  const registerBtn = await page.$('header button:has-text("Đăng ký")');
  const adminTab = await page.$('header button:has-text("Quản lý"), header button:has-text("Bảng quản lý")');
  const donateTab = await page.$('header button:has-text("Đăng đồ")');

  console.log('Login button visible:', !!loginBtn);
  console.log('Register button visible:', !!registerBtn);
  console.log('Admin tab visible:', !!adminTab);
  console.log('Donate tab visible:', !!donateTab);

  if (!loginBtn || !registerBtn) {
    throw new Error('FAILED: Login / Register buttons not visible for guest!');
  }
  if (adminTab || donateTab) {
    throw new Error('FAILED: Admin or Donate tab should not be visible in navbar for guest!');
  }

  // 2. Test Guest clicking Donate or Protected Route
  console.log('2. Testing Protected Route redirection for Guest...');
  // Trigger protected route by clicking on a Donate CTA or navigating directly
  const ctaDonate = await page.$('text=Tặng đồ ngay');
  if (ctaDonate) {
    await ctaDonate.click();
    await page.waitForTimeout(500);
    const authModalHeader = await page.$('text=Đăng nhập');
    console.log('AuthModal opened upon clicking CTA:', !!authModalHeader);
    if (!authModalHeader) {
      throw new Error('FAILED: AuthModal did not open on protected action!');
    }
    // Close modal
    const closeBtn = await page.$('button:has-text("✕")');
    if (closeBtn) await closeBtn.click();
  }

  // 3. Test Student Login / Session
  console.log('3. Testing Student Login...');
  // Open login modal
  await page.click('button:has-text("Đăng nhập")');
  await page.waitForTimeout(500);

  // Check no demo chips in modal
  const modalHs001 = await page.$('button:has-text("HS001 (Khánh)")');
  console.log('Modal demo chips present?', !!modalHs001);
  if (modalHs001) {
    throw new Error('FAILED: Demo chips found inside AuthModal!');
  }

  // Fill student credentials (hs001@leloiloop.edu.vn / LeLoiLoop@2026)
  await page.fill('input[type="text"], input[name="identifier"]', 'hs001');
  await page.fill('input[type="password"]', 'LeLoiLoop@2026');
  await page.click('button[type="submit"]:has-text("Đăng nhập")');

  // Wait for login response
  await page.waitForTimeout(2000);

  // Check if logged in
  const userMenuBtn = await page.$('button[title*="Hồ sơ"], button:has-text("Học sinh"), button:has-text("Lê Bá Khánh")');
  console.log('User profile badge visible:', !!userMenuBtn);

  // Check Admin tab is STILL hidden for student
  const studentAdminTab = await page.$('header button:has-text("Quản lý"), header button:has-text("Bảng quản lý")');
  console.log('Student sees Admin tab?', !!studentAdminTab);
  if (studentAdminTab) {
    throw new Error('FAILED: Student should NEVER see admin tab!');
  }

  console.log('✅ ALL PRODUCTION MODE VERIFICATIONS PASSED SUCCESSFULLY!');
  await browser.close();
}

verifyProductionMode().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
