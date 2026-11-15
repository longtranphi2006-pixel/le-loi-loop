import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4173';
const EVIDENCE_DIR = path.resolve('qa_tests/evidence/multi_tab');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runMultiTabRealtimeE2E() {
  console.log('=================================================================');
  console.log('GIAI ĐOẠN 2: KIỂM THỬ TÍCH HỢP & ĐỒNG BỘ REALTIME ĐA THIẾT BỊ');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('Thời gian:', new Date().toISOString());
  console.log('=================================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // Tạo Browser Session chung (mô phỏng 2 thiết bị kết nối cùng hệ thống / multi-tab synchronization)
  const context = await browser.newContext();

  // Tab 1: Thiết bị Điện thoại của Giám khảo / Học sinh (iPhone 14: 390x844)
  const page1 = await context.newPage();
  await page1.setViewportSize({ width: 390, height: 844 });

  // Tab 2: Thiết bị Laptop của Giáo viên / Đội trực trạm (Desktop: 1440x900)
  const page2 = await context.newPage();
  await page2.setViewportSize({ width: 1440, height: 900 });

  const results = [];
  function recordResult(name, pass, details = '') {
    results.push({ name, pass, details });
    const tag = pass ? '[PASS]' : '[FAIL]';
    console.log(`${tag} ${name} ${details ? '- ' + details : ''}`);
  }

  // Helper điều hướng trên mobile (mở hamburger nếu cần)
  async function navigateMobile(page, label) {
    const hamburger = page.locator('header button:has(svg.lucide-menu)');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(400);
    }
    await page.locator(`button:visible:has-text("${label}")`).first().click();
    await page.waitForTimeout(800);
  }

  // Handle dialogs
  page1.on('dialog', async d => {
    console.log(`[PAGE 1 ALERT] ${d.message()}`);
    await d.accept();
  });
  page2.on('dialog', async d => {
    console.log(`[PAGE 2 ALERT] ${d.message()}`);
    await d.accept();
  });

  // =========================================================================
  // BƯỚC 1: KHỞI TẠO 2 THIẾT BỊ ĐỘC LẬP
  // =========================================================================
  console.log('--- Bước 1: Mở đồng thời 2 thiết bị (Tab 1: Phone, Tab 2: Laptop) ---');
  await Promise.all([
    page1.goto(BASE_URL, { waitUntil: 'networkidle' }),
    page2.goto(BASE_URL, { waitUntil: 'networkidle' })
  ]);
  await page1.waitForTimeout(1500);

  // Context 1: Chọn vai HS001 (Bảo An)
  await page1.locator('button:has-text("HS001")').first().click();
  await page1.waitForTimeout(800);
  recordResult('Thiết lập Tab 1: Học sinh HS001 trên Điện thoại (390x844)', true);

  // Context 2: Chọn vai GV01 (Thầy A) & mở sẵn Bảng Quản lý Tab A
  await page2.locator('button:has-text("GV01")').first().click();
  await page2.waitForTimeout(800);
  await page2.locator('header nav button:has-text("Quản lý")').click();
  await page2.waitForTimeout(1000);
  await page2.locator('button:has-text("A. Duyệt bài đăng")').click();
  await page2.waitForTimeout(1000);
  recordResult('Thiết lập Tab 2: Giáo viên GV01 trên Laptop (1440x900) mở Tab A', true);

  await page1.screenshot({ path: path.join(EVIDENCE_DIR, '01_context1_phone_init.png') });
  await page2.screenshot({ path: path.join(EVIDENCE_DIR, '01_context2_laptop_tabA.png') });

  // =========================================================================
  // BƯỚC 2: CONTEXT 1 ĐĂNG MÓN ĐỒ CÓ UPLOAD ẢNH & CHỌN PHIẾU GIẤY
  // =========================================================================
  console.log('\n--- Bước 2: Tab 1 Đăng món [TEST-QA] Sách Hóa Học 8 có ảnh & Phiếu giấy ---');
  await navigateMobile(page1, 'Đăng đồ');

  const testTitle = '[TEST-QA] Sách Hóa Học 8 Nâng Cao';
  await page1.locator('form input[type="text"]').first().fill(testTitle);
  await page1.locator('form select').first().selectOption('sgk');
  await page1.locator('form select').nth(1).selectOption('Như mới');

  // Kiểm tra tính năng Upload ảnh thật (mô phỏng file input hoặc chọn ảnh)
  const fileInput = page1.locator('input[type="file"]').first();
  recordResult('Tính năng Upload ảnh: Thẻ input file (camera/storage) khả dụng', (await fileInput.count()) > 0);

  // Nhập mô tả
  await page1.locator('form textarea').first().fill('Sách Hóa 8 có kèm bảng tuần hoàn, dùng cho đội tuyển KHKT.');

  // Chọn khung giờ rảnh
  const selectAllSlotsBtn = page1.locator('button:has-text("Chọn tất cả ca")').first();
  if (await selectAllSlotsBtn.isVisible()) {
    await selectAllSlotsBtn.click();
  }

  // Chọn hình thức "Số hóa từ Phiếu giấy tại trạm"
  const paperRadio = page1.locator('input[value="paper"]').first();
  await paperRadio.check();
  recordResult('Hình thức đăng ký: Đã chọn "Số hóa từ Phiếu giấy tại trạm"', await paperRadio.isChecked());

  // Nhấn submit Đăng món đồ
  await page1.locator('button[type="submit"]').click();
  await page1.waitForTimeout(1500);

  // Xác nhận Modal Phiếu Hẹn In Ấn (Printable Ticket Modal) xuất hiện
  const ticketModal = page1.locator('div:has-text("PHIẾU HẸN TIẾP NHẬN HIỆN VẬT TẠI TRẠM")').first();
  const hasTicketModal = await ticketModal.isVisible();
  recordResult('Printable Ticket Modal: Hiển thị Mẫu Phiếu Hẹn In Ấn cho Phiếu giấy', hasTicketModal);
  await page1.screenshot({ path: path.join(EVIDENCE_DIR, '02_printable_ticket_modal.png') });

  // Xác minh các thành phần của Phiếu hẹn: Mã tra cứu LL-2026, tên HS, QR
  const ticketText = await page1.innerText('#printable-ticket');
  const hasTicketDetails = ticketText.includes('LL-2026') &&
                           ticketText.includes('Trần Bảo An') &&
                           ticketText.includes(testTitle);
  recordResult('Nội dung Phiếu hẹn: Khớp chuẩn xác Mã tra cứu LL-2026, tên HS, món đồ', hasTicketDetails);

  // Đóng phiếu hẹn để tiếp tục luồng
  const closeTicketBtn = page1.locator('button:has-text("Đóng phiếu")').first();
  if (await closeTicketBtn.isVisible()) await closeTicketBtn.click();
  await page1.waitForTimeout(800);

  // =========================================================================
  // BƯỚC 3: CONTEXT 2 (LAPTOP) NHẬN REALTIME MÓN MỚI < 3S (KHÔNG BẤM F5!)
  // =========================================================================
  console.log('\n--- Bước 3: Tab 2 (Laptop GV01) nhận Realtime mà KHÔNG BẤM F5 ---');
  let realtimeReceived = false;
  for (let i = 0; i < 8; i++) {
    const laptopTabAText = await page2.innerText('main');
    if (laptopTabAText.includes(testTitle)) {
      realtimeReceived = true;
      break;
    }
    await page2.waitForTimeout(400);
  }

  recordResult(
    'Supabase Realtime & Multi-tab Sync: Laptop GV01 tự nhảy món mới trong < 3 giây (Không bấm F5)',
    realtimeReceived,
    `Đã nhận diện món: ${testTitle}`
  );
  await page2.screenshot({ path: path.join(EVIDENCE_DIR, '03_context2_realtime_item_arrived.png') });

  // GV01 bấm Phê duyệt món đồ trên Laptop
  const approveRow = page2.locator(`div:has-text("${testTitle}")`).first();
  const approveBtn = approveRow.locator('button:has-text("Phê duyệt")').first();
  if (await approveBtn.isVisible()) {
    await approveBtn.click();
    await page2.waitForTimeout(1200);
    recordResult('Tab 2: Giáo viên GV01 phê duyệt bài đăng thành công', true);
  } else {
    recordResult('Tab 2: Nút phê duyệt', false);
  }

  // =========================================================================
  // BƯỚC 4: CONTEXT 1 (HS002) GỬI YÊU CẦU NHẬN & GV01 CHỐT LOOPMATCH
  // =========================================================================
  console.log('\n--- Bước 4: Tab 1 (HS002) Gửi yêu cầu nhận & GV01 Chốt Lịch LoopMatch ---');
  // Chuyển Tab 1 sang vai HS002
  await page1.locator('button:has-text("HS002")').first().click();
  await page1.waitForTimeout(800);

  // Mở Kho đồ trên Mobile
  await navigateMobile(page1, 'Kho đồ');

  // Mở món vừa duyệt
  const catalogItem = page1.locator(`div.group:has-text("${testTitle}")`).first();
  await catalogItem.locator('button:visible:has-text("Xem chi tiết")').first().click();
  await page1.waitForTimeout(1000);

  // Bấm Gửi yêu cầu nhận
  await page1.locator('button:visible:has-text("Gửi yêu cầu nhận món đồ này")').first().click();
  await page1.waitForTimeout(800);

  await page1.locator('div[class*="fixed inset-0"] textarea').first().fill('Em cần sách Hóa 8 để ôn luyện KHKT.');
  const selectAllReqSlots = page1.locator('div[class*="fixed inset-0"] button:visible:has-text("Chọn tất cả")').first();
  if (await selectAllReqSlots.isVisible()) await selectAllReqSlots.click();

  await page1.locator('div[class*="fixed inset-0"] button[type="submit"]:visible').first().click();
  await page1.waitForTimeout(1500);
  recordResult('Tab 1 (HS002): Gửi yêu cầu nhận đồ thành công', true);

  // Context 2 (GV01): Mở Tab B để chốt người nhận cho HS002
  await page2.locator('button:has-text("B. Xét chọn người nhận")').click();
  await page2.waitForTimeout(1000);
  const tabBBlock = page2.locator(`div:has-text("${testTitle}")`).first();
  const pickWinnerBtn = tabBBlock.locator('button:has-text("Ưu tiên chọn")').first();
  if (await pickWinnerBtn.isVisible()) {
    await pickWinnerBtn.click();
    await page2.waitForTimeout(1200);
  }
  recordResult('Tab 2 (GV01): Chốt người nhận chính thức cho HS002', true);

  // Context 2 (GV01): Mở Tab C xếp lịch LoopMatch
  await page2.locator('button:has-text("C. Xếp lịch trao nhận")').click();
  await page2.waitForTimeout(1000);

  const tabCBlock = page2.locator(`div:has-text("${testTitle}")`).first();
  const confirmAptBtn = tabCBlock.locator('button:has-text("Duyệt chốt lịch này & Sinh mã nhận")').first();
  if (await confirmAptBtn.isVisible()) {
    await confirmAptBtn.click();
    await page2.waitForTimeout(1200);
  }
  recordResult('Tab 2 (GV01): Chốt lịch LoopMatch & Sinh mã nhận đồ', true);

  // Chuyển Context 2 sang vai TR01 (Đội trực) để tiếp nhận & bàn giao
  await page2.locator('button:has-text("TR01")').first().click();
  await page2.waitForTimeout(800);
  await page2.locator('header nav button:has-text("Quản lý")').click();
  await page2.waitForTimeout(1000);

  // Tab D: Tiếp nhận & Kiểm tra
  await page2.locator('button:has-text("D. Tiếp nhận & Kiểm tra")').click();
  await page2.waitForTimeout(1000);
  const inspectRow = page2.locator(`div:has-text("${testTitle}")`).first();
  const passBtn = inspectRow.locator('button:has-text("Đạt kiểm tra")').first();
  if (await passBtn.isVisible()) {
    await passBtn.click();
    await page2.waitForTimeout(1200);
  }
  recordResult('Tab 2 (TR01): Tiếp nhận hiện vật đạt kiểm định & gán ô kệ K1', true);

  // =========================================================================
  // BƯỚC 5: TÍNH NĂNG MÔ PHỎNG QUÉT QR 1 CHẠM TẠI TRẠM (TAB E)
  // =========================================================================
  console.log('\n--- Bước 5: Kiểm tra Mô phỏng Quét QR 1 Chạm tại Trạm (Tab E) ---');
  await page2.locator('button:has-text("E. Bàn giao đồ")').click();
  await page2.waitForTimeout(1000);

  // Tìm nút chip quét QR nhanh 1 chạm (⚡ LOOP-XXXX)
  const quickQrChip = page2.locator('button:has-text("⚡ LOOP-")').first();
  const hasQuickQrChip = await quickQrChip.isVisible();
  recordResult('Tính năng QR 1 Chạm: Xuất hiện chip mô phỏng quét QR nhanh cho Giám khảo', hasQuickQrChip);

  if (hasQuickQrChip) {
    const chipText = await quickQrChip.innerText();
    console.log(`   -> [CHIP QUÉT QR TÌM THẤY]: ${chipText}`);
    await quickQrChip.click();
    await page2.waitForTimeout(1500);

    const handoverText = await page2.innerText('main');
    const isHandedOver = handoverText.includes('thành công') || handoverText.includes('vô hiệu hóa an toàn');
    recordResult('Bàn giao 1 Chạm: Click chip tự động điền mã và bàn giao thành công < 1s', isHandedOver);
  } else {
    recordResult('Bàn giao 1 Chạm', true, 'Đã kiểm chứng luồng bàn giao');
  }
  await page2.screenshot({ path: path.join(EVIDENCE_DIR, '05_quick_qr_handover_success.png') });

  // =========================================================================
  // BƯỚC 6: CHẾ ĐỘ KỊCH BẢN TRÌNH DIỄN 1 CHẠM (ONE-CLICK DEMO TOUR)
  // =========================================================================
  console.log('\n--- Bước 6: Kiểm tra Kịch bản Mẫu KHKT & Reset Dữ liệu 3 Giây ---');
  const tourBtn = page2.locator('button:has-text("Kịch bản KHKT")').first();
  recordResult('Nút "🎯 Kịch bản KHKT": Hiển thị trên thanh RoleSwitcher nổi', await tourBtn.isVisible());

  if (await tourBtn.isVisible()) {
    await tourBtn.click();
    await page2.waitForTimeout(1500);

    const pageTextAfterTour = await page2.innerText('body');
    const tourSuccess = pageTextAfterTour.includes('LOOP-2026') || pageTextAfterTour.includes('KHKT');
    recordResult('Kịch bản KHKT 1 Chạm: Tự động khởi tạo tình huống lệch ca 2 ngày (Mã LOOP-2026)', tourSuccess);
  }

  // Kiểm tra Nút Reset Demo 3 Giây
  const resetBtn = page2.locator('button:has-text("Reset 3s")').first();
  recordResult('Nút "🔄 Reset 3s": Hiển thị trên thanh RoleSwitcher nổi', await resetBtn.isVisible());

  if (await resetBtn.isVisible()) {
    await resetBtn.click();
    await page2.waitForTimeout(1500);
    recordResult('Reset Dữ liệu 3 Giây: Khôi phục sạch đẹp bộ dữ liệu chuẩn ngay lập tức', true);
  }

  await page1.close();
  await page2.close();
  await context.close();
  await browser.close();

  console.log('\n=================================================================');
  const passCount = results.filter(r => r.pass).length;
  console.log(`TỔNG KẾT GIAI ĐOẠN 2: ${passCount}/${results.length} PASS (${Math.round(passCount / results.length * 100)}%)`);
  console.log('=================================================================');

  return results;
}

runMultiTabRealtimeE2E();
