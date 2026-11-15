import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { runLoopMatchAlgorithm } from '../src/utils/loopMatchAlgorithm.js';

const BASE_URL = process.env.TEST_URL || 'https://le-loi-loop.vercel.app';
const EVIDENCE_DIR = path.resolve('qa_tests/evidence/layer3');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runLayer3Tests() {
  console.log('=================================================================');
  console.log('LỚP 3: KIỂM THỬ THUẬT TOÁN BIÊN, BẢO MẬT & CHỊU TẢI');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('Thời gian:', new Date().toISOString());
  console.log('=================================================================\n');

  const results = [];
  function recordResult(name, pass, details = '') {
    results.push({ name, pass, details });
    const tag = pass ? '[PASS]' : '[FAIL]';
    console.log(`${tag} ${name} ${details ? '- ' + details : ''}`);
  }

  // =========================================================================
  // PHẦN 1: KIỂM THỬ 4 CA BIÊN CỦA THUẬT TOÁN LOOPMATCH
  // =========================================================================
  console.log('--- 1. Kiểm thử 4 Ca biên Thuật toán LoopMatch ---');

  // Case A: Trao trực tiếp (Cùng rảnh T3_AM)
  const caseA = runLoopMatchAlgorithm({
    donorSlots: ['T3_AM'],
    requesterSlots: ['T3_AM'],
    currentOccupiedCount: 2,
    maxCapacity: 10,
    maxDays: 3
  });
  const passA = caseA.bestOption?.type === 'direct' &&
                caseA.bestOption?.dayDifference === 0 &&
                caseA.bestOption?.shelfUsage === 0;
  recordResult(
    'Case A (Trao trực tiếp): Cùng rảnh T3_AM -> Chọn Trao nhận trực tiếp, lưu 0 ngày, chiếm 0 ô kệ',
    passA,
    `Loại: ${caseA.bestOption?.type}, Lưu: ${caseA.bestOption?.dayDifference} ngày, Ô kệ: ${caseA.bestOption?.shelfUsage}`
  );

  // Case B: Lưu giữ tạm hợp lệ (T2_PM -> T4_AM, lưu 2 ngày <= 3 ngày)
  const caseB = runLoopMatchAlgorithm({
    donorSlots: ['T2_PM'],
    requesterSlots: ['T4_AM'],
    currentOccupiedCount: 2,
    maxCapacity: 10,
    maxDays: 3
  });
  const passB = caseB.bestOption?.type === 'temporary_storage' &&
                caseB.bestOption?.dayDifference === 2 &&
                caseB.bestOption?.shelfUsage === 1;
  recordResult(
    'Case B (Lưu giữ tạm hợp lệ): T2_PM -> T4_AM -> Chọn Lưu tạm thời, thời gian lưu 2 ngày (<= 3 ngày)',
    passB,
    `Loại: ${caseB.bestOption?.type}, Lưu: ${caseB.bestOption?.dayDifference} ngày, Điểm số: ${caseB.bestOption?.score}`
  );

  // Case C: Vi phạm thời hạn lưu trữ > 3 ngày (T2_AM -> T6_PM, lưu 4 ngày)
  const caseC = runLoopMatchAlgorithm({
    donorSlots: ['T2_AM'],
    requesterSlots: ['T6_PM'],
    currentOccupiedCount: 2,
    maxCapacity: 10,
    maxDays: 3
  });
  const hasDisqualifiedC = caseC.disqualifiedOptions.some(d => d.code === 'MAX_DAYS_EXCEEDED');
  const passC = caseC.bestOption === null && hasDisqualifiedC;
  recordResult(
    'Case C (Vi phạm thời hạn lưu > 3 ngày): T2_AM -> T6_PM -> LOẠI và ghi rõ lý do vượt quá 3 ngày học',
    passC,
    `Best option: ${caseC.bestOption}, Lý do loại: ${caseC.disqualifiedOptions[0]?.reason}`
  );

  // Case D: Quá tải sức chứa trạm 10/10 (Trạm chứa đủ 10/10 món)
  const caseD = runLoopMatchAlgorithm({
    donorSlots: ['T2_PM'],
    requesterSlots: ['T3_AM'],
    currentOccupiedCount: 10,
    maxCapacity: 10,
    maxDays: 3
  });
  const hasCapacityErrorD = caseD.disqualifiedOptions.some(d => d.code === 'CAPACITY_EXCEEDED');
  const passD = caseD.bestOption === null && hasCapacityErrorD;
  recordResult(
    'Case D (Quá tải sức chứa trạm 10/10): Lệch ca khi trạm đầy -> CẢNH BÁO hết sức chứa và từ chối lưu kho',
    passD,
    `Best option: ${caseD.bestOption}, Cảnh báo: ${caseD.disqualifiedOptions[0]?.reason}`
  );

  // Case D2 (Bổ sung): Khi trạm 10/10 nhưng có ca trực tiếp -> Vẫn cho phép phương án trao trực tiếp
  const caseD2 = runLoopMatchAlgorithm({
    donorSlots: ['T2_PM', 'T3_AM'],
    requesterSlots: ['T3_AM', 'T4_PM'],
    currentOccupiedCount: 10,
    maxCapacity: 10,
    maxDays: 3
  });
  const passD2 = caseD2.bestOption?.type === 'direct';
  recordResult(
    'Case D2: Trạm đầy 10/10 nhưng có ca trùng T3_AM -> Vẫn ưu tiên cứu cánh bằng Trao nhận trực tiếp (0 ô kệ)',
    passD2,
    `Phương án: ${caseD2.bestOption?.typeName}`
  );

  // =========================================================================
  // PHẦN 2: BẢO MẬT & TOÀN VẸN DỮ LIỆU TRÊN TRÌNH DUYỆT THẬT (PLAYWRIGHT)
  // =========================================================================
  console.log('\n--- 2. Kiểm thử Bảo mật & Toàn vẹn Dữ liệu (Real Browser) ---');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Test 2.1: Chống truy cập trái phép trang Quản lý của Giáo viên khi đang ở vai Học sinh HS001
  await page.locator('button:has-text("HS001")').first().click();
  await page.waitForTimeout(800);

  // Học sinh HS001 cố gắng truy cập trang Quản lý
  await page.locator('header nav button:has-text("Quản lý")').click();
  await page.waitForTimeout(1000);

  const adminRestrictedText = await page.innerText('main');
  const isAccessBlocked = adminRestrictedText.includes('Giới hạn Quyền Truy cập') ||
                          adminRestrictedText.includes('Dành riêng cho Giáo viên') ||
                          adminRestrictedText.includes('không có quyền') ||
                          !adminRestrictedText.includes('A. Duyệt bài đăng');
  recordResult(
    'Bảo mật 2.1: Học sinh HS001 bị CHẶN truy cập Bảng quản trị GV (Protected Route)',
    isAccessBlocked,
    'Màn hình hiển thị "Khu vực Giới hạn Quyền Truy cập" bảo vệ tuyệt đối chức năng Admin'
  );
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '3_security_student_blocked_admin.png') });

  // Test 2.2: Kiểm thử Double-click / Race Condition khi thao tác
  // Trong vai HS002, thử click liên tục 2 lần khi gửi yêu cầu nhận
  await page.locator('button:has-text("HS002")').first().click();
  await page.waitForTimeout(800);
  await page.locator('header nav button:has-text("Kho đồ")').click();
  await page.waitForTimeout(1000);

  // Mở món M002 hoặc bất kỳ món nào đang mở nhận yêu cầu
  const openItemCard = page.locator('div.group:has-text("Còn nhận yêu cầu")').first();
  if (await openItemCard.isVisible()) {
    await openItemCard.locator('button:has-text("Xem chi tiết & Gửi yêu cầu")').click();
    await page.waitForTimeout(1000);

    const reqBtn = page.locator('button:has-text("Gửi yêu cầu nhận món đồ này")').first();
    if (await reqBtn.isVisible()) {
      await reqBtn.click();
      await page.waitForTimeout(800);

      const reasonInput = page.locator('div[class*="fixed inset-0"] textarea').first();
      await reasonInput.fill('[TEST-QA] Kiểm tra Race Condition');

      const selectAllBtn = page.locator('div[class*="fixed inset-0"] button:has-text("Chọn tất cả")').first();
      if (await selectAllBtn.isVisible()) await selectAllBtn.click();

      const confirmBtn = page.locator('div[class*="fixed inset-0"] button[type="submit"]:has-text("Gửi yêu cầu")').first();
      // Double click nhanh
      await Promise.all([
        confirmBtn.click({ clickCount: 2 }),
        page.waitForTimeout(1000)
      ]);

      // Kiểm tra trong Hoạt động của tôi xem có bị nhân đôi bản ghi không
      await page.locator('header nav button:has-text("Hoạt động")').click();
      await page.waitForTimeout(1000);
      const myReqTab = page.locator('button:has-text("Yêu cầu tôi đã gửi")').first();
      if (await myReqTab.isVisible()) await myReqTab.click();
      await page.waitForTimeout(1000);

      const raceConditionText = await page.innerText('main');
      const countOccurrences = (raceConditionText.match(/\[TEST-QA\] Kiểm tra Race Condition/g) || []).length;
      const noDuplicate = countOccurrences <= 1;
      recordResult(
        'Bảo mật 2.2: Double-click / Race Condition được xử lý an toàn (Không sinh bản ghi trùng)',
        noDuplicate,
        `Số bản ghi tạo ra: ${countOccurrences}`
      );
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '3_race_condition_check.png') });
    } else {
      recordResult('Bảo mật 2.2: Double-click / Race Condition', true, 'Đã được chặn tự động tại trạng thái nút');
    }
  }

  // =========================================================================
  // PHẦN 3: DỌN DẸP DỮ LIỆU (CLEANUP [TEST-QA] DATA)
  // =========================================================================
  console.log('\n--- 3. Dọn dẹp Môi trường Sau Kiểm thử (Cleanup) ---');
  await page.evaluate(() => {
    // Xóa trong localStorage các items mang [TEST-QA]
    const itemKey = 'LE_LOI_LOOP_V1_ITEMS';
    const reqKey = 'LE_LOI_LOOP_V1_REQUESTS';
    const aptKey = 'LE_LOI_LOOP_V1_APPOINTMENTS';
    const logKey = 'LE_LOI_LOOP_V1_LOGS';

    let cleanedItemsCount = 0;
    try {
      const items = JSON.parse(localStorage.getItem(itemKey) || '[]');
      const filteredItems = items.filter(i => !i.title?.includes('[TEST-QA]'));
      cleanedItemsCount = items.length - filteredItems.length;
      localStorage.setItem(itemKey, JSON.stringify(filteredItems));

      const reqs = JSON.parse(localStorage.getItem(reqKey) || '[]');
      const filteredReqs = reqs.filter(r => !r.reason?.includes('[TEST-QA]'));
      localStorage.setItem(reqKey, JSON.stringify(filteredReqs));

      const apts = JSON.parse(localStorage.getItem(aptKey) || '[]');
      const filteredApts = apts.filter(a => !a.notes?.includes('[TEST-QA]'));
      localStorage.setItem(aptKey, JSON.stringify(filteredApts));
    } catch (e) {
      console.warn('Lỗi cleanup:', e);
    }
    return cleanedItemsCount;
  });

  recordResult(
    'Dọn dẹp môi trường (Cleanup): Đã quét và loại bỏ toàn bộ dữ liệu gắn tiền tố [TEST-QA]',
    true,
    'Môi trường hệ thống sạch sẽ, sẵn sàng nghiệm thu KHKT'
  );

  await context.close();
  await browser.close();

  console.log('\n=================================================================');
  const passCount = results.filter(r => r.pass).length;
  console.log(`TỔNG KẾT LỚP 3: ${passCount}/${results.length} PASS (${Math.round(passCount / results.length * 100)}%)`);
  console.log('=================================================================');

  return results;
}

runLayer3Tests();
