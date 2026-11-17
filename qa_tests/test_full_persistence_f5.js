import { chromium } from 'playwright';

async function testPersistenceAfterF5() {
  console.log('🚀 Bắt đầu kiểm thử Kiểm định Khả năng Lưu trữ & F5 (Reload Test)...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Mở trang web lần đầu
  console.log('1. Mở trang http://localhost:4173/ ...');
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 2. Đăng nhập tài khoản HS001
  console.log('2. Đăng nhập tài khoản học sinh HS001...');
  await page.click('header button:has-text("Đăng nhập")');
  await page.waitForTimeout(500);

  await page.fill('input[type="text"], input[name="identifier"]', 'hs001');
  await page.fill('input[type="password"]', 'LeLoiLoop@2026');
  await page.click('button[type="submit"]:has-text("Đăng nhập")');
  await page.waitForTimeout(1500);

  const userBadge = await page.$('button[title*="Hồ sơ"], button:has-text("Lê Bá Khánh"), button:has-text("Trần Bảo An"), button:has-text("Học sinh")');
  if (!userBadge) {
    throw new Error('Đăng nhập HS001 thất bại!');
  }
  console.log('✓ Đăng nhập thành công!');

  // 3. Đăng 1 món đồ mới
  console.log('3. Đăng món đồ mới: [TEST-F5] Balo Đi Học THCS Lê Lợi ...');
  await page.click('header nav button:has-text("Đăng đồ")');
  await page.waitForTimeout(800);

  const testTitle = '[TEST-F5] Balo Đi Học THCS Lê Lợi';
  await page.fill('form input[type="text"]', testTitle);
  // select category
  const selectCat = page.locator('form select').first();
  if (await selectCat.isVisible()) {
    await selectCat.selectOption({ index: 3 }); // balo
  }
  await page.fill('form textarea', 'Balo học sinh còn rất mới 95%, không rách, dùng tốt.');
  // Chọn ca rảnh gửi đồ
  const selectAllBtn = page.locator('button:has-text("Chọn tất cả ca")').first();
  if (await selectAllBtn.isVisible()) {
    await selectAllBtn.click();
    await page.waitForTimeout(300);
  }

  await page.click('button[type="submit"]:has-text("Gửi đăng món đồ")');
  await page.waitForTimeout(1500);

  // Nếu có Modal Phiếu hẹn (PrintableTicketModal) hiện ra, đóng lại
  const closeTicketBtn = page.locator('button:has-text("Đóng"), button:has-text("✕")').first();
  if (await closeTicketBtn.isVisible()) {
    await closeTicketBtn.click();
    await page.waitForTimeout(500);
  }

  // Kiểm tra món xuất hiện trong Hoạt động của tôi -> Tab "Món tôi đã đăng"
  await page.click('header nav button:has-text("Hoạt động")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Món tôi đã đăng")');
  await page.waitForTimeout(500);

  let activityText = await page.innerText('body');
  console.log('Activity text snippet:', activityText.slice(0, 500));
  if (!activityText.includes(testTitle)) {
    throw new Error('Món đồ chưa xuất hiện trong mục Hoạt động -> Món tôi đã đăng!');
  }
  console.log('✓ Đã đăng món đồ và xuất hiện trong "Món tôi đã đăng"!');

  // 4. THAO TÁC F5 (RELOAD TOÀN BỘ TRANG) ĐỂ KIỂM CHỨNG TÍNH LƯU TRỮ VĨNH VIỄN
  console.log('4. THỰC HIỆN F5 (PAGE RELOAD)...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 5. Kiểm tra phiên đăng nhập và dữ liệu sau F5
  console.log('5. Kiểm tra sau khi F5:');
  const userAfterF5 = await page.$('button[title*="Hồ sơ"], button:has-text("Lê Bá Khánh"), button:has-text("Trần Bảo An"), button:has-text("Học sinh")');
  console.log('-> Tài khoản HS001 còn duy trì sau F5?', !!userAfterF5);
  if (!userAfterF5) {
    throw new Error('FAILED: Tài khoản bị mất sau khi F5!');
  }

  // Vào lại trang Hoạt động -> Tab "Món tôi đã đăng"
  await page.click('header nav button:has-text("Hoạt động")');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Món tôi đã đăng")');
  await page.waitForTimeout(500);

  activityText = await page.innerText('body');
  const itemPersisted = activityText.includes(testTitle);
  console.log('-> Món đồ [TEST-F5] Balo Đi Học còn nguyên vẹn sau F5?', itemPersisted);
  if (!itemPersisted) {
    throw new Error('FAILED: Dữ liệu món đồ đã bị biến mất sau khi F5!');
  }

  // 6. THỬ NGHIỆM TIẾP VỚI QUYỀN GIÁO VIÊN / ADMIN VÀ KIỂM TRA LƯU TRỮ KỆ
  console.log('\n6. Đăng xuất HS001 và Đăng nhập GV01 (Giáo viên)...');
  await page.click('header button:has-text("Trần Bảo An"), header button:has-text("Học sinh")');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Đăng xuất")');
  await page.waitForTimeout(1000);

  // Đăng nhập GV01
  await page.click('header button:has-text("Đăng nhập")');
  await page.waitForTimeout(500);
  await page.fill('input[type="text"], input[name="identifier"]', 'gv01');
  await page.fill('input[type="password"]', 'LeLoiLoop@2026');
  await page.click('button[type="submit"]:has-text("Đăng nhập")');
  await page.waitForTimeout(1500);

  // Bảng quản lý xuất hiện
  console.log('7. Giáo viên vào Quản lý để duyệt món đồ...');
  await page.click('header nav button:has-text("Quản lý")');
  await page.waitForTimeout(1000);

  // Tab A: Duyệt bài đăng
  await page.click('button:has-text("A. Duyệt bài đăng")');
  await page.waitForTimeout(500);

  const approveBtn = page.locator('button:has-text("Phê duyệt")').first();
  if (await approveBtn.isVisible()) {
    await approveBtn.click();
    await page.waitForTimeout(1000);
    console.log('✓ Giáo viên đã phê duyệt món đồ!');
  } else {
    throw new Error('FAILED: Nút Phê duyệt không hiển thị trên Tab A!');
  }

  // F5 lần 2 để kiểm chứng trạng thái đã duyệt có duy trì hay không
  console.log('8. F5 LẦN 2: Kiểm chứng trạng thái bài duyệt sau Reload...');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Kiểm tra món đã xuất hiện trong Kho đồ công khai
  await page.click('header nav button:has-text("Kho đồ")');
  await page.waitForTimeout(1000);
  const catalogText = await page.innerText('body');
  const inCatalog = catalogText.includes(testTitle);
  console.log('-> Món đồ đã duyệt xuất hiện công khai trên Kho đồ sau F5?', inCatalog);
  if (!inCatalog) {
    throw new Error('FAILED: Món đồ đã duyệt không xuất hiện trên Kho đồ sau F5!');
  }

  console.log('🎉 XÁC NHẬN: TOÀN BỘ QUY TRÌNH DUYỆT VÀ TRẠNG THÁI LƯU TRỮ VĨNH VIỄN 100%!');
  await browser.close();
}

testPersistenceAfterF5().catch(err => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
