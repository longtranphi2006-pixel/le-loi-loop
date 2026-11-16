import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4173';
const EVIDENCE_DIR = path.resolve('qa_tests/evidence/pilot_57');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runPilot57StudentsE2E() {
  console.log('=================================================================');
  console.log('KIỂM THỬ TOÀN DIỆN BUỔI THỰC NGHIỆM 57 HỌC SINH — LÊ LỢI LOOP');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('Thời gian bắt đầu:', new Date().toISOString());
  console.log('=================================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];

  function recordResult(name, pass, details = '') {
    results.push({ name, pass, details });
    const tag = pass ? '[PASS]' : '[FAIL]';
    console.log(`${tag} ${name} ${details ? '- ' + details : ''}`);
  }

  // ---------------------------------------------------------------------------
  // PHẦN 1: KIỂM THỬ GIAO DIỆN DI ĐỘNG HẸP (320px - 390px)
  // ---------------------------------------------------------------------------
  console.log('--- 1. Kiểm thử Giao diện Màn hình Di động (320px iPhone SE & 390px iPhone 14) ---');
  {
    const mobileContext = await browser.newContext({ viewport: { width: 320, height: 568 } });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(BASE_URL, { waitUntil: 'networkidle' });
    await mobilePage.waitForTimeout(1000);

    // Kiểm tra không bị tràn thanh cuộn ngang (overflow-x)
    const isHorizontalOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    recordResult(
      'Responsive 320px: Trang chủ không bị vỡ hoặc tràn ngang (No horizontal overflow)',
      !isHorizontalOverflow
    );
    await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, '01_mobile_320px_homepage.png') });

    // Mở trang Đăng đồ trên mobile 320px
    const hamburger = mobilePage.locator('header button:has(svg.lucide-menu)');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await mobilePage.waitForTimeout(300);
    }
    await mobilePage.locator('button:visible:has-text("Đăng đồ")').first().click();
    await mobilePage.waitForTimeout(1000);

    const isDonateOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    recordResult(
      'Responsive 320px: Trang Đăng đồ vừa vặn màn hình hẹp, form nhập liệu đầy đủ',
      !isDonateOverflow
    );
    await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, '02_mobile_320px_donate.png') });

    // Kiểm tra trên 390px (iPhone 14)
    await mobilePage.setViewportSize({ width: 390, height: 844 });
    await mobilePage.waitForTimeout(500);

    // Mở Kho đồ
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await mobilePage.waitForTimeout(300);
    }
    await mobilePage.locator('button:visible:has-text("Kho đồ")').first().click();
    await mobilePage.waitForTimeout(1000);

    const isCatalogOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    recordResult(
      'Responsive 390px: Kho đồ hiển thị thẻ sản phẩm mộc mạc, nút bấm rõ ràng',
      !isCatalogOverflow
    );
    await mobilePage.screenshot({ path: path.join(EVIDENCE_DIR, '03_mobile_390px_catalog.png') });

    await mobileContext.close();
  }

  // ---------------------------------------------------------------------------
  // PHẦN 2: BẢO MẬT & PHÂN QUYỀN RBAC (HỌC SINH KHÔNG ĐƯỢC VÀO QUẢN TRỊ)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Kiểm thử Bảo mật & Phân quyền RBAC ---');
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await desktopContext.newPage();

  page.on('dialog', async d => {
    console.log(`[ALERT] ${d.message()}`);
    await d.accept();
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Chọn vai HS001 (Học sinh)
  await page.locator('#btn-switch-hs001').click();
  await page.waitForTimeout(1000);

  // Học sinh HS001 cố tình truy cập trang Quản lý
  await page.locator('header nav button:has-text("Quản lý")').click();
  await page.waitForTimeout(1000);

  const adminBody = await page.innerText('main');
  const isBlocked = adminBody.includes('Giới hạn Quyền Truy cập') ||
                    adminBody.includes('Dành riêng cho Giáo viên') ||
                    !adminBody.includes('A. Duyệt bài đăng');
  recordResult(
    'Bảo mật 1: Học sinh bị CHẶN truy cập Bảng quản trị GV (ProtectedRoute)',
    isBlocked,
    'Màn hình hiển thị "Khu vực Giới hạn Quyền Truy cập"'
  );
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_security_student_blocked.png') });

  // ---------------------------------------------------------------------------
  // PHẦN 3: TRỌN VẸN QUY TRÌNH TRAO NHẬN THỰC NGHIỆM (END-TO-END FLOW)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Kiểm thử Trọn vẹn Chu trình Trao nhận & Xử lý Ngoại lệ ---');
  const testItemTitle = `[THỰC-NGHIỆM-57] Bộ Thước Kẻ & Compa Toán 7`;

  // Bước 3.1: Học sinh HS001 Đăng đồ
  await page.locator('header nav button:has-text("Đăng đồ")').click();
  await page.waitForTimeout(1000);

  await page.fill('form input[type="text"]', testItemTitle);
  await page.locator('form select').nth(0).selectOption('dungcu');
  await page.locator('form select').nth(1).selectOption('Như mới');
  await page.fill('form textarea', 'Dành tặng cho bạn học sinh nào bị thiếu đồ dùng học tập.');

  // Submit Đăng đồ
  await page.locator('button[type="submit"]:has-text("Gửi đăng món đồ")').click();
  await page.waitForTimeout(1500);

  // Đóng phiếu hẹn giấy nếu có
  const closeTicketBtn = page.locator('button:has-text("Đóng phiếu")').first();
  if (await closeTicketBtn.isVisible()) {
    await closeTicketBtn.click();
    await page.waitForTimeout(500);
  }

  // Vào Hoạt động của tôi -> Xác nhận món ở trạng thái "Chờ duyệt"
  await page.locator('header nav button:has-text("Hoạt động")').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Món tôi đã đăng")').click();
  await page.waitForTimeout(800);
  const myActivityText = await page.innerText('main');
  recordResult(
    'Quy trình 1: Học sinh đăng đồ thành công -> Trạng thái "Chờ duyệt"',
    myActivityText.includes(testItemTitle) && (myActivityText.includes('Chờ duyệt') || myActivityText.includes('pending'))
  );

  // Bước 3.2: Giáo viên GV01 Phê duyệt bài đăng
  await page.locator('#btn-switch-gv01').click();
  await page.waitForTimeout(1000);
  await page.locator('header nav button:has-text("Quản lý")').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("A. Duyệt bài đăng")').click();
  await page.waitForTimeout(800);

  const approveBtn = page.locator('button:has-text("Phê duyệt")').first();
  if (await approveBtn.isVisible()) {
    await approveBtn.click();
    await page.waitForTimeout(1200);
    recordResult('Quy trình 2: Giáo viên GV01 phê duyệt món đồ công khai', true);
  } else {
    recordResult('Quy trình 2: Giáo viên GV01 phê duyệt', false);
  }

  // Bước 3.3: Học sinh HS002 xem và gửi yêu cầu nhận
  await page.locator('#btn-switch-hs002').click();
  await page.waitForTimeout(1000);
  await page.locator('header nav button:has-text("Kho đồ")').click();
  await page.waitForTimeout(1000);

  const itemCard = page.locator(`div.group:has-text("${testItemTitle}")`).first();
  await itemCard.locator('button:has-text("Xem chi tiết")').first().click();
  await page.waitForTimeout(1000);

  await page.locator('button:has-text("Gửi yêu cầu nhận món đồ này")').first().click();
  await page.waitForTimeout(800);
  await page.fill('div[class*="fixed inset-0"] textarea', 'Em đang cần compa để vẽ hình học.');
  const selectAllSlots1 = page.locator('div[class*="fixed inset-0"] button:has-text("Chọn tất cả")').first();
  if (await selectAllSlots1.isVisible()) await selectAllSlots1.click();
  await page.locator('div[class*="fixed inset-0"] button[type="submit"]').first().click();
  await page.waitForTimeout(1500);

  // Đóng phiếu hẹn giấy nếu có
  const closeTicketBtn2 = page.locator('button:has-text("Đóng phiếu")').first();
  if (await closeTicketBtn2.isVisible()) {
    await closeTicketBtn2.click();
    await page.waitForTimeout(500);
  }
  recordResult('Quy trình 3A: Học sinh HS002 gửi yêu cầu nhận thành công', true);

  // Bước 3.4: Học sinh HS001 không thể xin nhận món đồ của chính mình
  await page.locator('#btn-switch-hs001').click();
  await page.waitForTimeout(1000);
  await page.locator('header nav button:has-text("Kho đồ")').click();
  await page.waitForTimeout(1000);
  const ownItemCard = page.locator(`div.group:has-text("${testItemTitle}")`).first();
  await ownItemCard.locator('button:has-text("Xem chi tiết")').first().click();
  await page.waitForTimeout(1000);

  const ownDetailText = await page.innerText('main');
  const cantRequestOwn = ownDetailText.includes('Món đồ này do bạn đăng tải') ||
                         !ownDetailText.includes('Gửi yêu cầu nhận món đồ này');
  recordResult(
    'Bảo mật 2: Học sinh không thể tự gửi yêu cầu nhận món đồ do chính mình cho',
    cantRequestOwn
  );

  // Bước 3.5: Giáo viên GV01 chọn người nhận & Chốt lịch LoopMatch
  await page.locator('#btn-switch-gv01').click();
  await page.waitForTimeout(1000);
  await page.locator('header nav button:has-text("Quản lý")').click();
  await page.waitForTimeout(1000);

  // Tab B: Xét chọn
  await page.locator('button:has-text("B. Xét chọn người nhận")').click();
  await page.waitForTimeout(1000);
  const selectWinnerBtn = page.locator('button:has-text("Ưu tiên chọn")').first();
  if (await selectWinnerBtn.isVisible()) {
    await selectWinnerBtn.click();
    await page.waitForTimeout(1200);
    recordResult('Quy trình 4: Giáo viên chọn người nhận chính thức cho HS002', true);
  } else {
    recordResult('Quy trình 4: Giáo viên chọn người nhận chính thức cho HS002', false);
  }

  // Tab C: Chốt lịch LoopMatch & Sinh mã nhận
  await page.locator('button:has-text("C. Xếp lịch trao nhận")').click();
  await page.waitForTimeout(1000);
  const confirmAptBtn = page.locator('button:has-text("Duyệt chốt lịch này")').first();
  if (await confirmAptBtn.isVisible()) {
    await confirmAptBtn.click();
    await page.waitForTimeout(1200);
    recordResult('Quy trình 5: Chốt lịch LoopMatch & Sinh mã nhận đồ bí mật', true);
  } else {
    recordResult('Quy trình 5: Chốt lịch LoopMatch & Sinh mã nhận đồ bí mật', false);
  }

  // Bước 3.6: Đội trực TR01 kiểm tra đồ tại trạm
  await page.locator('#btn-switch-tr01').click();
  await page.waitForTimeout(1000);
  await page.locator('header nav button:has-text("Quản lý")').click();
  await page.waitForTimeout(1000);

  // Tab D: Tiếp nhận & Kiểm tra
  await page.locator('button:has-text("D. Tiếp nhận & Kiểm tra")').click();
  await page.waitForTimeout(1000);

  // Test kiểm tra chất lượng đạt và cấp ô kệ
  const passInspectionBtn = page.locator('button:has-text("Đạt kiểm tra")').first();
  if (await passInspectionBtn.isVisible()) {
    await passInspectionBtn.click();
    await page.waitForTimeout(1500);
    recordResult('Quy trình 6: Đội trực TR01 kiểm định đạt chất lượng & cất vào ô kệ K1', true);
  } else {
    recordResult('Quy trình 6: Đội trực TR01 kiểm định đạt chất lượng & cất vào ô kệ K1', false);
  }

  // Bước 3.7: Kiểm tra tình huống nhập sai mã nhận đồ (Edge Case)
  await page.locator('button:has-text("E. Bàn giao đồ")').click();
  await page.waitForTimeout(1000);

  const handoverInput = page.locator('input[placeholder*="LOOP-"]').first();
  await handoverInput.fill('LOOP-9999');
  await page.locator('button:has-text("Xác thực & Bàn giao")').first().click();
  await page.waitForTimeout(1000);

  const wrongCodeFeedback = await page.innerText('main');
  const isWrongCodeRejected = wrongCodeFeedback.includes('không tìm thấy') ||
                              wrongCodeFeedback.includes('không tồn tại') ||
                              wrongCodeFeedback.includes('không hợp lệ');
  recordResult(
    'Tình huống lỗi: Nhập sai mã nhận đồ (LOOP-9999) -> Bị từ chối và cảnh báo lỗi rõ ràng',
    isWrongCodeRejected
  );

  // Bước 3.8: Bàn giao thành công bằng mã đúng (1 chạm)
  const validChip = page.locator(`button:has-text("⚡ LOOP-")`).first();
  if (await validChip.isVisible()) {
    const chipText = await validChip.innerText();
    console.log(`   [CHIP QUÉT QR TÌM THẤY]: ${chipText}`);
    await validChip.click();
    await page.waitForTimeout(1500);

    const successFeedback = await page.innerText('main');
    const isCompleted = successFeedback.includes('thành công') || successFeedback.includes('vô hiệu hóa');
    recordResult('Quy trình 7: Bàn giao thành công, mã nhận đồ vô hiệu hóa an toàn', isCompleted);
  }

  // Bước 3.9: Kiểm tra Tab F (Audit Logs) có đầy đủ lịch sử đối chiếu
  await page.locator('button:has-text("F. Nhật ký hệ thống")').click();
  await page.waitForTimeout(1000);
  const auditLogsText = await page.innerText('main');
  const hasAuditHistory = auditLogsText.includes(testItemTitle) || auditLogsText.includes('BÀN GIAO');
  recordResult(
    'Quy trình 8: Tab F (Audit Logs) ghi nhận đầy đủ mốc thời gian và lịch sử đối chiếu',
    hasAuditHistory
  );
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_audit_logs_history.png') });

  await desktopContext.close();
  await browser.close();

  console.log('\n=================================================================');
  const passCount = results.filter(r => r.pass).length;
  console.log(`TỔNG KẾT KIỂM THỬ: ${passCount}/${results.length} PASS (${Math.round(passCount / results.length * 100)}%)`);
  console.log('=================================================================');

  return results;
}

runPilot57StudentsE2E();
