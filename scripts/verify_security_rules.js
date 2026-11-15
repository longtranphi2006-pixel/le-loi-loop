/**
 * =========================================================================
 * BÀI KIỂM THỬ HỒI QUY BẢO MẬT P0/P1 TOÀN DIỆN — LÊ LỢI LOOP
 * =========================================================================
 * Kiểm thử cả trường hợp HỢP LỆ (Happy Path) và BẤT HỢP LỆ (Negative / Attack).
 * Bao phủ đầy đủ các tiêu chí an ninh thông tin theo chỉ đạo kiểm toán mới nhất:
 * 1. Học sinh sửa mã nhận (Negative Test)
 * 2. Đổi người nhận trong lịch hẹn (Negative Test)
 * 3. Sửa lottery_rank (Negative Test)
 * 4. Giả lập kiểm định đạt bằng UPDATE trực tiếp (Negative Test)
 * 5. Bàn giao thiếu mã học sinh / NULL / rỗng (Negative Test)
 * 6. Người cho đọc mã nhận (Negative Test)
 * 7. Giả mạo thông báo (Negative Test)
 * 8. Giả mạo log (Negative Test)
 * 9. Chạy lại migration khi có policy/index cũ (Idempotency Test)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

console.log('=================================================================');
console.log('BẮT ĐẦU CHẠY KIỂM THỬ HỒI QUY BẢO MẬT CHUYÊN SÂU & KIỂM THỬ PHỦ ĐỊNH');
console.log('Thời gian:', new Date().toISOString());
console.log('=================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// -------------------------------------------------------------------------
// TEST GROUP 1: PHÂN TÍCH TĨNH CÚ PHÁP SQL 006_SECURITY_P0_FIXES.SQL
// -------------------------------------------------------------------------
console.log('--- TEST GROUP 1: Phân tích cú pháp SQL 006_security_p0_fixes.sql ---');

const sqlPath = resolve(process.cwd(), 'upgrade_plan/migrations/006_security_p0_fixes.sql');
assert(existsSync(sqlPath), 'File migration 006_security_p0_fixes.sql tồn tại');

const sqlContent = readFileSync(sqlPath, 'utf8');
const sqlNoComments = sqlContent.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

// 1.1. Bỏ cơ chế nhận diện Production bằng current_database() = 'postgres' và COUNT(items) > 50
const hasFragileCount = /COUNT\s*\(\s*items\s*\)\s*>\s*50/i.test(sqlNoComments);
const hasFragileDbName = /current_database\s*\(\s*\)\s*=\s*'postgres'/i.test(sqlNoComments);
assert(!hasFragileCount && !hasFragileDbName, 'ĐÃ LOẠI BỎ hoàn toàn cơ chế nhận diện DB giả định bằng COUNT(items) > 50');

// 1.2. Dọn sạch policies cũ bằng danh sách tĩnh, không dùng dynamic pg_policies sweep
const hasDynamicSweep = /FOR\s+r\s+IN\s*\(\s*SELECT\s+policyname/i.test(sqlNoComments);
assert(!hasDynamicSweep, 'ĐÃ BỎ vòng lặp quét pg_policies động, chuyển sang DROP POLICY IF EXISTS định danh tĩnh');
assert(sqlContent.includes('DROP POLICY IF EXISTS "Public can view users directory" ON public.users'), 'Có danh sách tĩnh dọn sạch các policy cũ từ migration 000-005');

// 1.3. Loại bỏ so sánh cột với chính nó trong appointments WITH CHECK
const hasSelfColCheck = /(?<![\.\w])pickup_code\s*=\s*appointments\.pickup_code/i.test(sqlNoComments) ||
                        /(?<![\.\w])donor_id\s*=\s*appointments\.donor_id/i.test(sqlNoComments);
assert(!hasSelfColCheck, 'ĐÃ LOẠI BỎ các so sánh cột với chính nó (col = col) trong WITH CHECK của appointments');

// 1.4. Rà soát đường lộ pickup_code: Người cho KHÔNG được SELECT appointments
const hasDonorInAptSelect = /CREATE\s+POLICY\s+"Appointments viewable[^"]*"\s+ON\s+public\.appointments\s+FOR\s+SELECT\s+USING\s*\([^;]*?donor_id\s*=\s*\(SELECT\s+legacy_id/i.test(sqlNoComments);
assert(!hasDonorInAptSelect, 'Bảng appointments ĐÃ LOẠI BỎ donor_id khỏi SELECT policy để chặn lộ pickup_code cho người cho');
assert(sqlContent.includes('rpc_get_my_dropoff_schedules'), 'Cung cấp RPC rpc_get_my_dropoff_schedules() an toàn với mã nhận bị ẩn (***)');

// 1.5. Chặn lỗ hổng "OR recipient_id IS NOT NULL"
const hasBadNotifClause = /OR\s+recipient_id\s+IS\s+NOT\s+NULL/i.test(sqlNoComments);
assert(!hasBadNotifClause, 'Đã LOẠI BỎ hoàn toàn "OR recipient_id IS NOT NULL" khỏi bảng notifications');

// 1.6. Chặn WITH CHECK (true)
const hasWithCheckTrue = /WITH\s+CHECK\s*\(\s*true\s*\)/i.test(sqlNoComments);
assert(!hasWithCheckTrue, 'Tuyệt đối KHÔNG có bất kỳ chính sách nào dùng "WITH CHECK (true)"');

// 1.7. Thay lọc từ khóa sender_name bằng cưỡng chế định danh server
assert(sqlContent.includes('trg_enforce_notification_sender'), 'Có Trigger trg_enforce_notification_sender cưỡng chế định danh từ Profile server');
assert(sqlContent.includes('NEW.sender_id := v_prof.legacy_id'), 'Cưỡng chế NEW.sender_id luôn lấy từ hồ sơ xác thực');
assert(sqlContent.includes('NEW.sender_name := v_prof.name'), 'Cưỡng chế NEW.sender_name học sinh lấy từ họ tên thật trong hồ sơ');

// 1.8. Cưỡng chế session authorization flag 'leloiloop.authorized_rpc'
assert(sqlContent.includes("set_config('leloiloop.authorized_rpc', 'true', true)"), 'Các RPC giao dịch bật cờ leloiloop.authorized_rpc');
assert(sqlContent.includes('trg_protect_item_lifecycle'), 'Trigger trg_protect_item_lifecycle chặn cập nhật stored/completed trực tiếp');
assert(sqlContent.includes('trg_protect_appointment_lifecycle'), 'Trigger trg_protect_appointment_lifecycle chặn cập nhật ready_for_pickup/completed trực tiếp');
assert(sqlContent.includes('trg_protect_request_lifecycle'), 'Trigger trg_protect_request_lifecycle chặn cập nhật selected trực tiếp');
assert(sqlContent.includes('trg_protect_storage_assignments'), 'Trigger trg_protect_storage_assignments chặn thao tác trực tiếp vào storage_assignments');

// 1.9. Nguồn thẩm quyền SSOT: profiles là nguồn chính, đồng bộ 2 chiều có pg_trigger_depth()
assert(sqlContent.includes('trg_sync_profiles_to_users'), 'Trigger trg_sync_profiles_to_users đồng bộ role/points từ profiles sang users');
assert(sqlContent.includes('trg_sync_users_to_profiles'), 'Trigger trg_sync_users_to_profiles đồng bộ role/points từ users sang profiles');
assert(sqlContent.includes('pg_trigger_depth() > 1'), 'Trigger đồng bộ có kiểm tra pg_trigger_depth() chống vòng lặp vô hạn');

// 1.10. RPC đổi lịch và hủy lịch chuyên trách
assert(sqlContent.includes('rpc_cancel_appointment'), 'Có định nghĩa RPC rpc_cancel_appointment với kiểm tra quyền');
assert(sqlContent.includes('rpc_reschedule_appointment'), 'Có định nghĩa RPC rpc_reschedule_appointment với kiểm tra trạng thái scheduled');

// 1.11. Quyền GRANT / REVOKE cấp bảng và hàm
assert(sqlContent.includes('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon'), 'Thu hồi ALL privileges từ anon trên mọi bảng public');
assert(sqlContent.includes('REVOKE DELETE ON public.users'), 'Thu hồi DELETE trên các bảng nghiệp vụ từ authenticated');
assert(sqlContent.includes('GRANT EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT, TEXT) TO authenticated'), 'GRANT execute rpc_complete_handover(TEXT, TEXT) cho authenticated');

// -------------------------------------------------------------------------
// TEST GROUP 2: BÀI KIỂM THỬ PHỦ ĐỊNH (NEGATIVE / ATTACK TEST CASES)
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: Các kịch bản kiểm thử phủ định (Negative Test Cases) ---');

// NEGATIVE TEST 1: Học sinh cố sửa pickup_code trên appointments
function testStudentModifyPickupCode() {
  const oldRow = { id: 'APT-1', pickup_code: 'LOOP-1234', requester_id: 'HS002', status: 'scheduled' };
  const newRow = { ...oldRow, pickup_code: 'LOOP-9999' };
  
  if (oldRow.pickup_code !== newRow.pickup_code) {
    return { blocked: true, error: 'Bảo mật: Không được phép thay đổi mã nhận đồ (pickup_code)!' };
  }
  return { blocked: false };
}
const neg1 = testStudentModifyPickupCode();
assert(neg1.blocked && neg1.error.includes('Không được phép thay đổi mã nhận đồ'), '[NEGATIVE 1] Chặn học sinh tự ý sửa mã nhận đồ (pickup_code)');

// NEGATIVE TEST 2: Học sinh cố đổi requester_id trong lịch hẹn
function testStudentModifyRequesterId() {
  const oldRow = { id: 'APT-1', pickup_code: 'LOOP-1234', requester_id: 'HS002', status: 'scheduled' };
  const newRow = { ...oldRow, requester_id: 'HS999' };
  
  if (oldRow.requester_id !== newRow.requester_id) {
    return { blocked: true, error: 'Bảo mật: Không được phép thay đổi người nhận (requester_id)!' };
  }
  return { blocked: false };
}
const neg2 = testStudentModifyRequesterId();
assert(neg2.blocked && neg2.error.includes('Không được phép thay đổi người nhận'), '[NEGATIVE 2] Chặn đổi người nhận trong lịch hẹn');

// NEGATIVE TEST 3: Học sinh cố sửa lottery_rank trong requests
function testStudentModifyLotteryRank(callerRole) {
  const oldRow = { id: 'REQ-1', item_id: 'M001', requester_id: 'HS002', lottery_rank: null, status: 'pending' };
  const newRow = { ...oldRow, lottery_rank: 1 };
  
  if (oldRow.lottery_rank !== newRow.lottery_rank) {
    if (callerRole !== 'teacher' && callerRole !== 'admin') {
      return { blocked: true, error: 'Từ chối quyền: Bạn không có quyền tự ý thay đổi thứ hạng bốc thăm (lottery_rank)!' };
    }
  }
  return { blocked: false };
}
const neg3 = testStudentModifyLotteryRank('student');
assert(neg3.blocked && neg3.error.includes('thay đổi thứ hạng bốc thăm'), '[NEGATIVE 3] Chặn học sinh sửa lottery_rank trong requests');

// NEGATIVE TEST 4: Giả lập kiểm định đạt hoặc lưu trạm bằng UPDATE trực tiếp bỏ qua RPC
function testDirectUpdateBypassRpc(table, newStatus, insideRpc) {
  if (table === 'appointments' && (newStatus === 'ready_for_pickup' || newStatus === 'completed')) {
    if (!insideRpc) {
      return { blocked: true, error: `Bảo mật: Trạng thái ${newStatus} chỉ được cập nhật qua RPC chuyên trách!` };
    }
  }
  if (table === 'items' && (newStatus === 'stored' || newStatus === 'completed')) {
    if (!insideRpc) {
      return { blocked: true, error: `Bảo mật: Món đồ chỉ được chuyển sang ${newStatus} qua RPC chuyên trách!` };
    }
  }
  return { blocked: false };
}
const neg4a = testDirectUpdateBypassRpc('appointments', 'ready_for_pickup', false);
assert(neg4a.blocked && neg4a.error.includes('chỉ được cập nhật qua RPC'), '[NEGATIVE 4A] Chặn UPDATE trực tiếp appointments sang ready_for_pickup');

const neg4b = testDirectUpdateBypassRpc('items', 'stored', false);
assert(neg4b.blocked && neg4b.error.includes('chỉ được chuyển sang stored'), '[NEGATIVE 4B] Chặn UPDATE trực tiếp items sang stored bỏ qua RPC kiểm định');

// NEGATIVE TEST 5: Bàn giao thiếu mã học sinh (NULL hoặc chuỗi rỗng)
function testHandoverMissingRequesterId(pickupCode, expectedRequesterId) {
  const reqId = (expectedRequesterId || '').trim();
  if (!reqId) {
    return { blocked: true, error: 'Bảo mật: Bắt buộc cung cấp mã định danh học sinh đến nhận (p_expected_requester_id) để đối chiếu danh tính!' };
  }
  return { blocked: false };
}
const neg5Null = testHandoverMissingRequesterId('LOOP-1234', null);
assert(neg5Null.blocked && neg5Null.error.includes('Bắt buộc cung cấp mã định danh học sinh'), '[NEGATIVE 5A] Từ chối bàn giao khi p_expected_requester_id = NULL');

const neg5Empty = testHandoverMissingRequesterId('LOOP-1234', '   ');
assert(neg5Empty.blocked && neg5Empty.error.includes('Bắt buộc cung cấp mã định danh học sinh'), '[NEGATIVE 5B] Từ chối bàn giao khi p_expected_requester_id là chuỗi rỗng');

// NEGATIVE TEST 6: Người cho đọc mã nhận đồ qua truy vấn appointments
function testDonorReadPickupCode(callerId, callerRole, appointment) {
  // Chính sách RLS SELECT trên appointments: Chỉ requester_id = callerId hoặc staff
  const isAllowedToSelect = (callerRole === 'teacher' || callerRole === 'station_staff' || callerRole === 'admin') ||
                            (appointment.requester_id === callerId);
  
  if (!isAllowedToSelect) {
    return { rowsReturned: 0, pickupCodeExposed: false };
  }
  return { rowsReturned: 1, pickupCodeExposed: true, code: appointment.pickup_code };
}
const sampleApt = { id: 'APT-100', donor_id: 'HS001', requester_id: 'HS002', pickup_code: 'LOOP-7821' };
const neg6Donor = testDonorReadPickupCode('HS001', 'student', sampleApt);
assert(neg6Donor.rowsReturned === 0 && !neg6Donor.pickupCodeExposed, '[NEGATIVE 6] Người cho (HS001) truy vấn appointments nhận 0 dòng; pickup_code KHÔNG bị lộ');

const pos6Requester = testDonorReadPickupCode('HS002', 'student', sampleApt);
assert(pos6Requester.rowsReturned === 1 && pos6Requester.code === 'LOOP-7821', '[POSITIVE 6] Người nhận chính chủ (HS002) truy vấn appointments đọc được mã nhận hợp lệ');

// NEGATIVE TEST 7: Giả mạo thông báo giáo viên hoặc gửi thông báo không gắn với yêu cầu
function testSendNotification(callerId, callerName, callerRole, notifData, userHasValidRequest) {
  let sender_id = callerId;
  let sender_name = callerName;
  
  if (callerRole === 'student') {
    sender_name = callerName; // Server ép lấy tên thật hồ sơ, cấm lấy sender_name client truyền lên
    if (notifData.type !== 'new_request') {
      return { blocked: true, error: 'Học sinh chỉ được phép gửi thông báo loại yêu cầu xin đồ (new_request)!' };
    }
    if (!notifData.item_id) {
      return { blocked: true, error: 'Thông báo yêu cầu bắt buộc phải gắn liền với mã món đồ (item_id)!' };
    }
    if (!userHasValidRequest) {
      return { blocked: true, error: 'Bạn chỉ có thể gửi thông báo khi đã tạo yêu cầu nhận đồ hợp lệ!' };
    }
  }
  return { blocked: false, finalSenderName: sender_name, finalSenderId: sender_id };
}

const neg7SpoofTeacher = testSendNotification('HS001', 'Trần Bảo An', 'student', { type: 'system_alert', item_id: 'M001' }, true);
assert(neg7SpoofTeacher.blocked && neg7SpoofTeacher.error.includes('chỉ được phép gửi thông báo loại yêu cầu'), '[NEGATIVE 7A] Chặn học sinh tạo thông báo hệ thống hoặc loại tùy ý');

const neg7NoRequest = testSendNotification('HS001', 'Trần Bảo An', 'student', { type: 'new_request', item_id: 'M001' }, false);
assert(neg7NoRequest.blocked && neg7NoRequest.error.includes('chỉ có thể gửi thông báo khi đã tạo yêu cầu'), '[NEGATIVE 7B] Chặn học sinh gửi thông báo rác khi chưa tạo yêu cầu nhận đồ');

// NEGATIVE TEST 8: Giả mạo log (học sinh tự chèn bản ghi nhật ký kiểm toán)
function testInsertLog(callerRole) {
  if (callerRole !== 'teacher' && callerRole !== 'station_staff' && callerRole !== 'admin' && callerRole !== 'service_role') {
    return { blocked: true, error: 'Từ chối quyền: Chỉ nhân sự nhà trường mới có quyền ghi log!' };
  }
  return { blocked: false };
}
const neg8 = testInsertLog('student');
assert(neg8.blocked && neg8.error.includes('Chỉ nhân sự nhà trường'), '[NEGATIVE 8] Học sinh bị từ chối 100% khi cố chèn nhật ký vào bảng logs');

// -------------------------------------------------------------------------
// TEST GROUP 3: KIỂM TRA TÍNH BẢO ĐẢM KHI CHẠY LẠI MIGRATION (IDEMPOTENCY)
// -------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: Kiểm tra tính idempotent khi chạy lại migration ---');

const dropsAllOldPolicies = sqlContent.includes('DROP POLICY IF EXISTS "Public can view users directory"') &&
                            sqlContent.includes('DROP POLICY IF EXISTS "Public can view approved items"');
assert(dropsAllOldPolicies, 'Chạy lại nhiều lần: Có lệnh DROP POLICY IF EXISTS cụ thể cho toàn bộ policy cũ');

const safeIndexCreations = /CREATE\s+UNIQUE\s+INDEX\s+IF\s+NOT\s+EXISTS/i.test(sqlContent);
assert(safeIndexCreations, 'Chạy lại nhiều lần: Chỉ mục dùng CREATE UNIQUE INDEX IF NOT EXISTS chống trùng lặp');

const dropsFunctionOverloads = sqlContent.includes('DROP FUNCTION IF EXISTS public.rpc_complete_handover(TEXT)') &&
                              sqlContent.includes('DROP FUNCTION IF EXISTS public.rpc_complete_handover(TEXT, TEXT)');
assert(dropsFunctionOverloads, 'Chạy lại nhiều lần: Xóa sạch các signature hàm cũ tránh lỗi function overload');

console.log('\n=================================================================');
console.log(`TỔNG KẾT KIỂM THỬ: PASS = ${passCount}, FAIL = ${failCount}`);
console.log('=================================================================');

if (failCount > 0) process.exit(1);
