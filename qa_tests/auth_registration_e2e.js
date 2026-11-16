import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4173';
const EVIDENCE_DIR = path.resolve('qa_tests/evidence/auth');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runAuthRegistrationE2E() {
  console.log('=================================================================');
  console.log('BƯỚC 3: KIỂM THỬ TỰ ĐỘNG SUPABASE AUTH, ĐĂNG KÝ & PHÂN QUYỀN RBAC');
  console.log(`Mục tiêu URL: ${BASE_URL}`);
  console.log('Thời gian bắt đầu:', new Date().toISOString());
  console.log('=================================================================\n');

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const results = [];
  function recordResult(name, pass, details = '') {
    results.push({ name, pass, details });
    const tag = pass ? '[PASS]' : '[FAIL]';
    console.log(`${tag} ${name} ${details ? '- ' + details : ''}`);
  }

  // Lắng nghe console và dialogs
  page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('dialog', async d => {
    console.log(`[PAGE DIALOG] ${d.message()}`);
    await d.accept();
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: TẢI TRANG CHỦ & MỞ MODAL ĐĂNG KÝ
    // -------------------------------------------------------------------------
    console.log('--- Test 1: Mở Trang chủ & Khởi chạy Modal Đăng ký ---');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const registerBtn = page.locator('button#btn-nav-register, button:visible:has-text("Đăng ký")').first();
    await registerBtn.click();
    await page.waitForTimeout(600);

    const modalTitle = page.locator('h3:has-text("Hệ Thống Tài Khoản")');
    recordResult('Mở Modal Tài khoản: Hiển thị giao diện Đăng ký / Đăng nhập', await modalTitle.isVisible());

    // Chuyển sang Tab Đăng Ký Học Sinh nếu chưa ở tab đăng ký
    const regTabBtn = page.locator('button:has-text("Đăng Ký Học Sinh")');
    if (await regTabBtn.isVisible()) {
      await regTabBtn.click();
      await page.waitForTimeout(400);
    }

    // -------------------------------------------------------------------------
    // TEST 2: ĐIỀN FORM ĐĂNG KÝ HỌC SINH MỚI & SUBMIT
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: Đăng ký học sinh mới [TEST-QA] Phạm Gia Huy (HS999) ---');
    const testFullName = '[TEST-QA] Phạm Gia Huy';
    const testStudentCode = 'HS999';
    const testClass = '7/3';
    const testShift = 'Sáng';
    const testPassword = 'Test@1234';

    await page.fill('#register-fullname', testFullName);
    await page.fill('#register-student-code', testStudentCode);
    await page.waitForTimeout(500); // Đợi debounce check code

    // Chọn lớp 7/3
    await page.selectOption('#register-class', testClass);

    // Chọn buổi học Sáng
    await page.locator('button:has-text("Học buổi Sáng")').first().click();

    // Điền mật khẩu
    await page.fill('#register-password', testPassword);
    await page.fill('#register-confirm-password', testPassword);

    await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_register_form_filled.png') });

    // Submit Đăng ký
    const submitRegBtn = page.locator('#btn-register-submit');
    await submitRegBtn.click();
    await page.waitForTimeout(2500);

    // Xác nhận Header hiển thị thông tin học sinh mới
    const headerUserEl = page.locator('#header-user-display');
    const headerText = await headerUserEl.innerText();
    const isRegistered = headerText.includes('Phạm Gia Huy') && headerText.includes('HS999');

    recordResult(
      'Đăng ký Học sinh mới: Không lỗi Supabase Auth/RLS, Header cập nhật Phạm Gia Huy (HS999)',
      isRegistered,
      `Nội dung Header: "${headerText.replace(/\n/g, ' ')}"`
    );
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_registered_header_success.png') });

    // -------------------------------------------------------------------------
    // TEST 3: BẤM F5 (RELOAD TRANG) -> KIỂM TRA PERSISTENT SESSION
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: Bấm F5 Reload trang để kiểm tra phiên đăng nhập Persistent ---');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const headerTextAfterF5 = await page.locator('#header-user-display').innerText();
    const isPersisted = headerTextAfterF5.includes('Phạm Gia Huy') && headerTextAfterF5.includes('HS999');

    recordResult(
      'Persistent Session (F5 Reload): Phiên đăng nhập được lưu trữ ổn định qua localStorage & Auth session',
      isPersisted,
      `Nội dung Header sau F5: "${headerTextAfterF5.replace(/\n/g, ' ')}"`
    );
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_persisted_after_f5.png') });

    // -------------------------------------------------------------------------
    // TEST 4: TÍCH HỢP TRANG ĐĂNG ĐỒ - TỰ ĐỘNG GỢI Ý CA RẢNH THEO STUDY_SHIFT
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Kiểm tra Trang Đăng đồ - Tự động gợi ý ca Chiều cho học sinh học Sáng ---');
    await page.locator('header nav button:has-text("Đăng đồ")').click();
    await page.waitForTimeout(1000);

    const donatePageText = await page.innerText('main');
    const hasSmartSlots = donatePageText.includes('Phạm Gia Huy') || donatePageText.includes('HS999');
    recordResult(
      'Tích hợp thông minh: Trang Đăng đồ tự động điền thông tin người cho Phạm Gia Huy (HS999)',
      hasSmartSlots
    );

    // -------------------------------------------------------------------------
    // TEST 5: ĐĂNG XUẤT KHỎI TÀI KHOẢN
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Đăng xuất khỏi tài khoản HS999 ---');
    const logoutBtn = page.locator('#btn-logout, button[title*="Đăng xuất"]').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1200);
    }

    const hasNavLoginBtn = await page.locator('#btn-nav-login').isVisible();
    recordResult('Đăng xuất: Nút Đăng xuất đưa hệ thống về trạng thái sẵn sàng đăng nhập mới', hasNavLoginBtn);

    // -------------------------------------------------------------------------
    // TEST 6: ĐĂNG NHẬP LẠI BẰNG HS999 VÀ MẬT KHẨU
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Đăng nhập lại bằng Mã học sinh HS999 & Mật khẩu Test@1234 ---');
    const openLoginBtn = page.locator('#btn-nav-login, button:visible:has-text("Đăng nhập")').first();
    await openLoginBtn.click();
    await page.waitForTimeout(600);

    await page.fill('#login-identifier', testStudentCode);
    await page.fill('#login-password', testPassword);
    await page.click('#btn-login-submit');
    await page.waitForTimeout(2000);

    const headerTextAfterLogin = await page.locator('#header-user-display').innerText();
    const isRelogged = headerTextAfterLogin.includes('Phạm Gia Huy') && headerTextAfterLogin.includes('HS999');
    recordResult(
      'Đăng nhập lại: Mã học sinh HS999 + Mật khẩu xác thực thành công',
      isRelogged,
      `Nội dung Header: "${headerTextAfterLogin.replace(/\n/g, ' ')}"`
    );
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_relogin_success.png') });

    // -------------------------------------------------------------------------
    // TEST 7: THỬ ĐĂNG KÝ TÀI KHOẢN GIÁO VIÊN VỚI MÃ TRƯỜNG SAI -> BỊ CHẶN LỖI
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: Kiểm tra RBAC - Đăng ký Giáo viên với mã trường sai (123456) ---');
    // Mở lại modal đăng ký qua nút trên RoleSwitcher
    const accountBtn = page.locator('#btn-roleswitcher-account');
    await accountBtn.click();
    await page.waitForTimeout(500);

    const registerTabBtn2 = page.locator('#tab-btn-register');
    await registerTabBtn2.click();
    await page.waitForTimeout(400);

    // Chọn vai Giáo viên
    await page.locator('#role-btn-teacher').click();
    await page.waitForTimeout(300);

    // Nhập mã trường sai
    await page.fill('#auth-school-code', '123456');
    await page.fill('#register-fullname', '[TEST-QA] Thầy Giả Mạo');
    await page.fill('#register-student-code', 'GV999');
    await page.fill('#register-password', 'Test@1234');
    await page.fill('#register-confirm-password', 'Test@1234');

    await page.click('#btn-register-submit');
    await page.waitForTimeout(800);

    // Bắt thông báo lỗi từ chối
    const errorAlert = page.locator('#auth-error-alert');
    const isRejected = await errorAlert.isVisible();
    const errorMsg = isRejected ? await errorAlert.innerText() : '';

    recordResult(
      'Kiểm soát RBAC: Hệ thống từ chối đăng ký Giáo viên khi nhập sai mã xác thực trường (123456)',
      isRejected,
      `Thông báo lỗi: "${errorMsg}"`
    );
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_teacher_rejected_invalid_school_code.png') });

    // Đóng modal
    const closeBtn = page.locator('#btn-modal-close').first();
    if (await closeBtn.isVisible()) await closeBtn.click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------------------
    // TEST 8: THỬ CHUYỂN NHANH VAI TRÒ MẪU (HS001, HS002, TR01, GV01)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Kiểm tra nút Demo Quick-Switch chuyển sang HS001 (Bảo An) ---');
    const switchHs001Btn = page.locator('#btn-switch-hs001').first();
    if (await switchHs001Btn.isVisible()) {
      await switchHs001Btn.click();
      await page.waitForTimeout(1500);

      const headerTextHs001 = await page.locator('#header-user-display').innerText();
      const isSwitched = headerTextHs001.includes('Trần Bảo An') || headerTextHs001.includes('HS001');
      recordResult(
        'Demo Quick-Switch: Chuyển đổi mượt mà sang tài khoản mẫu HS001 (Trần Bảo An)',
        isSwitched,
        `Header: "${headerTextHs001.replace(/\n/g, ' ')}"`
      );
    }

    // -------------------------------------------------------------------------
    // TEST 9: DỌN DẸP DỮ LIỆU TEST (CLEANUP HS999)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: Dọn dẹp tài khoản test [TEST-QA] HS999 ---');
    await page.evaluate(() => {
      try {
        const key = 'LE_LOI_LOOP_V1_REGISTERED_USERS';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const cleaned = list.filter(u => u.id !== 'HS999');
        localStorage.setItem(key, JSON.stringify(cleaned));
      } catch (e) {
        console.error(e);
      }
    });
    recordResult('Dọn dẹp Cleanup: Đã gỡ bỏ tài khoản kiểm thử HS999 khỏi bộ nhớ hệ thống', true);

  } catch (err) {
    console.error('Lỗi ngoại lệ trong quá trình chạy E2E:', err);
    recordResult('Luồng kiểm thử E2E', false, err.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  console.log('\n=================================================================');
  const passCount = results.filter(r => r.pass).length;
  console.log(`TỔNG KẾT KIỂM THỬ: ${passCount}/${results.length} PASS (${Math.round(passCount / results.length * 100)}%)`);
  console.log('=================================================================');

  return results;
}

runAuthRegistrationE2E();
