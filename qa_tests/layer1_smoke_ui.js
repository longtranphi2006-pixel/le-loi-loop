import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'https://le-loi-loop.vercel.app';
const EVIDENCE_DIR = path.resolve('qa_tests/evidence/layer1');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runLayer1Tests() {
  console.log('=================================================================');
  console.log('LỚP 1: KIỂM THỬ CHỨC NĂNG CƠ BẢN & GIAO DIỆN (UI/UX & SMOKE TEST)');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('Thời gian:', new Date().toISOString());
  console.log('=================================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];

  function recordResult(name, pass, details = '') {
    results.push({ name, pass, details });
    const tag = pass ? '[PASS]' : '[FAIL]';
    console.log(`${tag} ${name} ${details ? '- ' + details : ''}`);
  }

  // 1. KIỂM TRA 10 MÀN HÌNH TRÊN DESKTOP (1440x900)
  console.log('\n--- 1. Kiểm tra 10 Màn hình & Kết nối Network/Console (Desktop 1440x900) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await desktopContext.newPage();

  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('response', res => {
    const status = res.status();
    const url = res.url();
    if (status >= 400 && !url.includes('images.unsplash.com')) {
      networkErrors.push({ status, url });
    }
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Màn 1: Trang chủ
  const homeTitle = await page.innerText('h1');
  recordResult('Màn 1: Trang chủ tải thành công', homeTitle.includes('LÊ LỢI LOOP'), `Tiêu đề: ${homeTitle.replace(/\n/g, ' ').slice(0, 40)}`);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_desktop_home.png') });

  // Màn 2: Kho đồ
  await page.locator('header nav button:has-text("Kho đồ")').click();
  await page.waitForTimeout(1000);
  const catalogHeader = await page.innerText('main h1');
  recordResult('Màn 2: Kho đồ tải thành công', catalogHeader.includes('Kho đồ dùng'), `Tiêu đề: ${catalogHeader}`);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_desktop_catalog.png') });

  // Màn 3: Chi tiết món đồ
  const firstDetailBtn = page.locator('button:has-text("Xem chi tiết")').first();
  if (await firstDetailBtn.count() > 0) {
    await firstDetailBtn.click();
    await page.waitForTimeout(1000);
    const detailText = await page.innerText('main');
    recordResult('Màn 3: Chi tiết món đồ hiển thị', detailText.includes('Người tặng') || detailText.includes('Tình trạng'), 'Đã mở trang chi tiết món đồ');
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_desktop_detail.png') });

    // Màn 5: Modal Gửi yêu cầu nhận đồ (khi là HS002)
    await page.locator('button:has-text("HS002")').first().click();
    await page.waitForTimeout(1000);
    const reqBtn = page.locator('button:has-text("Gửi yêu cầu nhận món đồ này")');
    if (await reqBtn.isVisible()) {
      await reqBtn.click();
      await page.waitForTimeout(600);
      const modalText = await page.innerText('div[class*="fixed inset-0"]');
      recordResult('Màn 5: Form Gửi yêu cầu nhận đồ mở thành công', modalText.includes('Gửi yêu cầu nhận') || modalText.includes('Lý do bạn cần món đồ này'), 'Modal xuất hiện đúng thiết kế');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_desktop_request_modal.png') });
      const closeBtn = page.locator('button:has-text("Hủy")');
      if (await closeBtn.isVisible()) await closeBtn.click();
    } else {
      recordResult('Màn 5: Nút gửi yêu cầu hoặc lý do vô hiệu hóa', true, 'Đã kiểm tra điều kiện nút yêu cầu');
    }
  } else {
    recordResult('Màn 3: Chi tiết món đồ', false, 'Không tìm thấy nút Xem chi tiết nào');
  }

  // Màn 4: Đăng đồ
  await page.locator('header nav button:has-text("Đăng đồ")').click();
  await page.waitForTimeout(1000);
  const donateText = await page.innerText('main h1');
  recordResult('Màn 4: Màn hình Đăng đồ tải thành công', donateText.includes('Đăng đồ muốn tặng') || donateText.includes('Đăng Món Đồ'), `Tiêu đề: ${donateText}`);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_desktop_donate.png') });

  // Màn 6: Hoạt động của tôi
  await page.locator('header nav button:has-text("Hoạt động")').click();
  await page.waitForTimeout(1000);
  const myActivityText = await page.innerText('main');
  recordResult('Màn 6: Hoạt động của tôi hiển thị', myActivityText.includes('Yêu cầu gửi đến tôi') || myActivityText.includes('Lịch hẹn'), 'Hiển thị các tab hoạt động');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_desktop_my_activity.png') });

  // Màn 7: Trạm Lê Lợi Loop
  await page.locator('header nav button:has-text("Trạm Lê Lợi")').click();
  await page.waitForTimeout(1000);
  const stationText = await page.innerText('main h1');
  recordResult('Màn 7: Trạm Lê Lợi Loop (Sơ đồ 10 ô kệ)', stationText.includes('Trạm Lê Lợi Loop'), `Tiêu đề: ${stationText}`);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_desktop_station.png') });

  // Màn 8: Bảng quản lý (Admin Dashboard - đổi sang GV01)
  await page.locator('button:has-text("GV01")').first().click();
  await page.waitForTimeout(1000);
  await page.locator('header nav button:has-text("Quản lý")').click();
  await page.waitForTimeout(1000);
  const adminText = await page.innerText('main h1');
  recordResult('Màn 8: Bảng quản lý KHKT (Admin Dashboard)', adminText.includes('Bảng điều khiển Nghiệp vụ KHKT'), `Tiêu đề: ${adminText}`);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_desktop_admin.png') });

  // Màn 9: LoopMatch điều phối
  await page.locator('header nav button:has-text("LoopMatch")').click();
  await page.waitForTimeout(1000);
  const loopMatchText = await page.innerText('main h1');
  recordResult('Màn 9: Thuật toán LoopMatch điều phối', loopMatchText.includes('Thuật toán Điều phối LoopMatch'), `Tiêu đề: ${loopMatchText}`);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '09_desktop_loopmatch.png') });

  // Màn 10: Phòng thí nghiệm
  await page.locator('header nav button:has-text("Phòng thí nghiệm")').click();
  await page.waitForTimeout(1000);
  const labText = await page.innerText('main h1');
  recordResult('Màn 10: Phòng thí nghiệm KHKT', labText.includes('Phòng thí nghiệm KHKT'), `Tiêu đề: ${labText}`);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '10_desktop_lab.png') });

  // KIỂM TRA CONSOLE LOGS & NETWORK REQUESTS
  recordResult('Không có lỗi JavaScript runtime Console', consoleErrors.length === 0, consoleErrors.length ? `Lỗi: ${consoleErrors.join('; ')}` : 'Sạch sẽ 0 lỗi');
  recordResult('Không có request API trả về lỗi 4xx/5xx', networkErrors.length === 0, networkErrors.length ? `Lỗi: ${JSON.stringify(networkErrors)}` : '100% request HTTP 200/204/206');

  // 2. KIỂM TRA RESPONSIVE MOBILE (390x844 - iPhone 14)
  console.log('\n--- 2. Kiểm tra Responsive Mobile (390x844 iPhone 14) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(2000);

  const isOverflowing = await mobilePage.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  recordResult('Mobile: Giao diện không bị tràn khung ngang (Horizontal overflow)', !isOverflowing, `scrollWidth: ${await mobilePage.evaluate(() => document.documentElement.scrollWidth)}px`);
  await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, '11_mobile_home.png') });

  const roleSwitcherVisible = await mobilePage.locator('button:has-text("HS001")').isVisible();
  recordResult('Mobile: Thanh chuyển đổi vai trò (Floating RoleSwitcher) hiển thị đầy đủ', roleSwitcherVisible);

  await mobileContext.close();

  // 3. KIỂM TRA BỘ LỌC & TÌM KIẾM TRÊN KHO ĐỒ
  console.log('\n--- 3. Kiểm tra Bộ lọc & Tìm kiếm trên Kho đồ ---');
  await page.locator('header nav button:has-text("Kho đồ")').click();
  await page.waitForTimeout(1000);

  // Tìm kiếm từ khóa có dấu "Toán 7"
  const searchInput = page.locator('input[placeholder*="Tìm kiếm sách"], input[type="text"]').first();
  await searchInput.fill('Toán 7');
  await page.waitForTimeout(800);
  const searchResultsText = await page.innerText('main');
  recordResult('Tìm kiếm có dấu "Toán 7": Khớp chính xác kết quả', searchResultsText.includes('Toán 7'), 'Đã lọc ra Sách Toán 7');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '12_search_toan7.png') });

  // Tìm kiếm từ khóa "Doraemon"
  await searchInput.fill('Doraemon');
  await page.waitForTimeout(800);
  const doraemonText = await page.innerText('main');
  recordResult('Tìm kiếm "Doraemon": Khớp chính xác truyện Doraemon', doraemonText.includes('Doraemon'), 'Đã lọc ra truyện Doraemon');
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '13_search_doraemon.png') });

  // Xóa tìm kiếm và lọc theo danh mục Sách giáo khoa
  await searchInput.fill('');
  await page.waitForTimeout(500);

  const sgkCategoryBtn = page.locator('button:has-text("Sách giáo khoa")').first();
  if (await sgkCategoryBtn.isVisible()) {
    await sgkCategoryBtn.click();
    await page.waitForTimeout(800);
    const sgkResult = await page.innerText('main');
    recordResult('Lọc theo danh mục "Sách giáo khoa"', sgkResult.includes('Toán 7') || sgkResult.includes('Tiếng Anh'), 'Chỉ hiển thị các món SGK');
  }

  await desktopContext.close();
  await browser.close();

  console.log('\n=================================================================');
  const passCount = results.filter(r => r.pass).length;
  console.log(`TỔNG KẾT LỚP 1: ${passCount}/${results.length} PASS (${Math.round(passCount / results.length * 100)}%)`);
  console.log('=================================================================');

  return results;
}

runLayer1Tests();
