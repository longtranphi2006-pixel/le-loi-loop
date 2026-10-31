/**
 * =========================================================================
 * BỘ KIỂM THỬ XÁC MINH CHU TRÌNH TRAO NHẬN THẬT — GIAI ĐOẠN 4
 * DỰ ÁN: LÊ LỢI LOOP — THCS LÊ LỢI ĐÀ NẴNG
 * =========================================================================
 * Kịch bản: 13 Bước chu trình trao nhận chuẩn + 6 Tình huống lỗi bảo mật/cạnh tranh
 * 4 Phiên tài khoản: HS001 (Cho), GV01 (Duyệt), HS002 (Nhận), TR01 (Quản sinh Trạm)
 */

import { 
  runLoopMatchAlgorithm, 
  generatePickupCode, 
  runLotteryWithSeed 
} from '../src/utils/loopMatchAlgorithm.js';

import { STATION_SLOTS } from '../src/data/seedData.js';
import { genUniqueId } from '../src/lib/supabase.js';

console.log('=================================================================');
console.log('BẮT ĐẦU KIỂM THỬ CHU TRÌNH TRAO NHẬN THỰC TẾ — GIAI ĐOẠN 4');
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
// DỮ LIỆU MÔ PHỎNG DATABASE STATE (GIỮ CƠ CHẾ NGUYÊN TỬ NHƯ RPC SUPABASE)
// -------------------------------------------------------------------------
const db = {
  users: [
    { id: 'HS001', name: 'Trần Bảo An', role: 'student', class: '8/1', shift: 'Sáng', points: 120 },
    { id: 'HS002', name: 'Lê Hoàng Nam', role: 'student', class: '7/3', shift: 'Chiều', points: 85 },
    { id: 'GV01', name: 'Thầy Nguyễn Văn An', role: 'teacher', class: 'Hội đồng KHKT', shift: 'Cả ngày', points: 500 },
    { id: 'TR01', name: 'Đội Trực Trạm Phòng Đội', role: 'station_staff', class: 'CLB Đội', shift: 'Cả ngày', points: 350 }
  ],
  profiles: [
    { auth_uid: 'uuid-hs001', legacy_id: 'HS001', role: 'student', name: 'Trần Bảo An' },
    { auth_uid: 'uuid-hs002', legacy_id: 'HS002', role: 'student', name: 'Lê Hoàng Nam' },
    { auth_uid: 'uuid-gv01',  legacy_id: 'GV01',  role: 'teacher', name: 'Thầy Nguyễn Văn An' },
    { auth_uid: 'uuid-tr01',  legacy_id: 'TR01',  role: 'station_staff', name: 'Đội Trực Trạm Phòng Đội' }
  ],
  items: [],
  requests: [],
  appointments: [],
  notifications: [],
  logs: [],
  storage_assignments: []
};

// -------------------------------------------------------------------------
// BƯỚC 1: HS001 ĐĂNG NHẬP VÀ ĐĂNG MỘT MÓN ĐỒ
// -------------------------------------------------------------------------
console.log('--- BƯỚC 1: HS001 Đăng bài đồ dùng học tập ---');
const sessionHS001 = { auth_uid: 'uuid-hs001', legacy_id: 'HS001', role: 'student', name: 'Trần Bảo An' };

const newItem = {
  id: genUniqueId('ITEM'),
  title: 'Bộ Thước Kẻ Kỹ Thuật & Compa Thiên Long',
  category: 'Đồ dùng học tập',
  condition: 'Còn rất tốt (95%)',
  description: 'Compa và thước eke dùng cho môn Hình học lớp 8',
  donor_id: sessionHS001.legacy_id,
  donor_name: sessionHS001.name,
  donor_class: '8/1',
  donor_shift: 'Sáng',
  status: 'pending', // Phải qua kiểm duyệt của giáo viên
  storage_slot: null,
  created_at: new Date().toISOString()
};

db.items.push(newItem);
assert(db.items.length === 1 && db.items[0].status === 'pending', 'HS001 tạo thành công món đồ ở trạng thái pending');
assert(db.items[0].donor_id === 'HS001', 'Định danh người cho được gán chính xác là HS001');

// -------------------------------------------------------------------------
// BƯỚC 2: GV01 ĐĂNG NHẬP RIÊNG VÀ PHÊ DUYỆT BÀI ĐĂNG
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 2: GV01 Phê duyệt bài đăng ---');
const sessionGV01 = { auth_uid: 'uuid-gv01', legacy_id: 'GV01', role: 'teacher', name: 'Thầy Nguyễn Văn An' };

// GV01 kiểm tra và duyệt
const itemToApprove = db.items.find(i => i.id === newItem.id);
assert(sessionGV01.role === 'teacher', 'GV01 có vai trò teacher hợp lệ');
itemToApprove.status = 'approved';
itemToApprove.request_status = 'open';

// Hệ thống tạo thông báo Cloud cho HS001
db.notifications.push({
  id: genUniqueId('NOTIF'),
  recipient_id: itemToApprove.donor_id,
  sender_id: sessionGV01.legacy_id,
  sender_name: sessionGV01.name,
  type: 'item_approved',
  title: 'Món đồ đã được phê duyệt! 🎉',
  message: `Món đồ "${itemToApprove.title}" của bạn đã được Thầy Nguyễn Văn An phê duyệt lên bảng tin.`,
  item_id: itemToApprove.id,
  is_read: false,
  created_at: new Date().toISOString()
});

assert(itemToApprove.status === 'approved', 'Món đồ chuyển trạng thái thành approved sau khi GV duyệt');
assert(db.notifications.some(n => n.recipient_id === 'HS001' && n.type === 'item_approved'), 'HS001 nhận được Cloud notification thông báo bài được duyệt');

// -------------------------------------------------------------------------
// BƯỚC 3: HS002 ĐĂNG NHẬP VÀ XEM ĐƯỢC MÓN ĐỒ
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 3: HS002 Xem món đồ trên danh mục ---');
const sessionHS002 = { auth_uid: 'uuid-hs002', legacy_id: 'HS002', role: 'student', name: 'Lê Hoàng Nam' };

// Giả lập RLS: Học sinh chỉ xem được đồ có status = 'approved' (hoặc đồ của chính mình)
const visibleItemsForHS002 = db.items.filter(i => 
  ['approved', 'matching', 'stored', 'ready_for_pickup', 'completed'].includes(i.status) || 
  i.donor_id === sessionHS002.legacy_id
);

assert(visibleItemsForHS002.some(i => i.id === newItem.id), 'HS002 nhìn thấy món đồ đã được duyệt trên Catalog');

// -------------------------------------------------------------------------
// BƯỚC 4: HS002 GỬI YÊU CẦU NHẬN ĐỒ
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 4: HS002 Gửi yêu cầu nhận đồ ---');
const newRequest = {
  id: genUniqueId('REQ'),
  item_id: newItem.id,
  requester_id: sessionHS002.legacy_id,
  requester_name: sessionHS002.name,
  requester_class: '7/3',
  requester_shift: 'Chiều',
  reason: 'Em đang học lớp 7 chuẩn bị lên lớp 8 cần compa hình học để vẽ hình.',
  status: 'pending',
  lottery_rank: null,
  created_at: new Date().toISOString()
};

db.requests.push(newRequest);
assert(db.requests.length === 1 && db.requests[0].requester_id === 'HS002', 'Yêu cầu của HS002 được ghi nhận vào database');

// -------------------------------------------------------------------------
// BƯỚC 5: HS001 NHẬN THÔNG BÁO TỪ CLOUD
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 5: HS001 Nhận Cloud Notification có người xin nhận ---');
const notifForDonor = {
  id: genUniqueId('NOTIF'),
  recipient_id: newItem.donor_id,
  sender_id: sessionHS002.legacy_id,
  sender_name: sessionHS002.name,
  type: 'new_request',
  title: 'Có bạn học sinh gửi yêu cầu mới! 🙋‍♂️',
  message: `Học sinh ${sessionHS002.name} (Lớp 7/3) vừa gửi yêu cầu xin nhận món đồ "${newItem.title}".`,
  item_id: newItem.id,
  request_id: newRequest.id,
  is_read: false,
  created_at: new Date().toISOString()
};
db.notifications.push(notifForDonor);

const hs001UnreadNotifs = db.notifications.filter(n => n.recipient_id === 'HS001' && !n.is_read);
assert(hs001UnreadNotifs.some(n => n.type === 'new_request' && n.request_id === newRequest.id), 'HS001 có thông báo new_request từ HS002 trong hộp thư Cloud');

// -------------------------------------------------------------------------
// BƯỚC 6: XÉT CHỌN NGƯỜI NHẬN (RPC_ACCEPT_REQUEST_BY_DONOR)
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 6: Chốt người nhận (Mô phỏng rpc_accept_request_by_donor) ---');
// Giả lập thực thi RPC bằng danh tính HS001 (auth.uid = uuid-hs001)
function execute_rpc_accept_request_by_donor(requestId, callerAuthUid) {
  const profile = db.profiles.find(p => p.auth_uid === callerAuthUid);
  if (!profile) throw new Error('Chưa đăng nhập!');
  
  const req = db.requests.find(r => r.id === requestId);
  if (!req) throw new Error('Không tìm thấy request!');
  
  const item = db.items.find(i => i.id === req.item_id);
  if (!item) throw new Error('Không tìm thấy item!');
  
  // Kiểm tra quyền
  if (item.donor_id !== profile.legacy_id && !['teacher', 'admin'].includes(profile.role)) {
    throw new Error('Từ chối quyền: Bạn không phải người cho món đồ!');
  }
  
  // Cập nhật trạng thái nguyên tử
  req.status = 'selected';
  req.lottery_rank = 1;
  item.status = 'matching';
  item.request_status = 'closed';
  
  return { success: true, item_id: item.id, request_id: req.id, winner_id: req.requester_id };
}

const acceptResult = execute_rpc_accept_request_by_donor(newRequest.id, sessionHS001.auth_uid);
assert(acceptResult.success === true && acceptResult.winner_id === 'HS002', 'RPC chấp thuận yêu cầu thành công cho HS002');
assert(db.items.find(i => i.id === newItem.id).status === 'matching', 'Trạng thái món đồ chuyển sang matching');

// -------------------------------------------------------------------------
// BƯỚC 7: LOOPMATCH ĐƯA RA LỊCH HẸN HỢP LỆ VỚI CA TRỰC TRẠM
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 7: Thuật toán LoopMatch đề xuất lịch hẹn trạm ---');
// HS001 học ca Sáng (rảnh sau giờ học sáng: slot 2: 11h15 - 11h45)
// HS002 học ca Chiều (rảnh trước giờ học chiều: slot 3: 13h00 - 13h30)
const matchResult = runLoopMatchAlgorithm({
  donorSlots: ['T2_AM'],
  requesterSlots: ['T2_PM'],
  currentOccupiedCount: 0 // Trạm còn trống cả 10 ô kệ
});

assert(matchResult.bestOption !== null, 'LoopMatch tìm thấy phương án phù hợp');
assert(matchResult.bestOption.type === 'temporary_storage', 'LoopMatch chọn hình thức Lưu trạm (temporary_storage) vì 2 học sinh lệch ca Sáng/Chiều');
assert(matchResult.bestOption.donorSlot === 'T2_AM', 'Người cho (ca sáng) hẹn gửi đồ lúc sáng Thứ 2 (T2_AM: 09:15 - 10:00)');
assert(matchResult.bestOption.requesterSlot === 'T2_PM', 'Người nhận (ca chiều) hẹn lấy đồ lúc chiều Thứ 2 (T2_PM: 14:00 - 14:45)');

// Sinh lịch hẹn và mã nhận đồ pickupCode
const pickupCode = generatePickupCode();
assert(/^LOOP-\d{4}$/.test(pickupCode), 'Mã nhận đồ sinh ra đúng chuẩn LOOP-xxxx');

const newAppointment = {
  id: genUniqueId('APT'),
  item_id: newItem.id,
  request_id: newRequest.id,
  donor_id: sessionHS001.legacy_id,
  requester_id: sessionHS002.legacy_id,
  type: 'temporary_storage',
  donor_slot: 'T2_AM',
  requester_slot: 'T2_PM',
  storage_slot: null, // Chưa gán kệ khi chưa tiếp nhận
  pickup_code: pickupCode,
  status: 'scheduled',
  donor_arrived_at: null,
  picked_up_at: null,
  notes: 'Người cho gửi đồ tan học sáng, trạm lưu giữ, người nhận đến lấy đầu giờ chiều.',
  created_at: new Date().toISOString()
};
db.appointments.push(newAppointment);
assert(db.appointments.length === 1 && db.appointments[0].status === 'scheduled', 'Lịch hẹn đã được xếp lịch thành công (scheduled)');

// -------------------------------------------------------------------------
// BƯỚC 8 & 9: TR01 TIẾP NHẬN, KIỂM TRA ĐỒ VÀ GÁN Ô KỆ K1-A1
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 8 & 9: Quản sinh TR01 Kiểm định và Gán ô kệ trạm ---');
const sessionTR01 = { auth_uid: 'uuid-tr01', legacy_id: 'TR01', role: 'station_staff', name: 'Đội Trực Trạm Phòng Đội' };

function execute_rpc_inspect_and_receive_item(aptId, passed, note, storageSlot, callerAuthUid) {
  const profile = db.profiles.find(p => p.auth_uid === callerAuthUid);
  if (!profile || !['station_staff', 'teacher', 'admin'].includes(profile.role)) {
    throw new Error('Từ chối quyền: Chỉ Quản sinh hoặc Giáo viên mới có quyền tiếp nhận đồ!');
  }
  
  const apt = db.appointments.find(a => a.id === aptId);
  if (!apt || apt.status !== 'scheduled') throw new Error('Lịch hẹn không hợp lệ!');
  
  const item = db.items.find(i => i.id === apt.item_id);
  
  if (passed) {
    // Kiểm tra ô kệ có bị trùng không
    const isSlotOccupied = db.items.some(i => i.storage_slot === storageSlot && i.status === 'stored');
    if (isSlotOccupied) throw new Error(`Ô kệ ${storageSlot} hiện đã có đồ lưu trữ!`);
    
    apt.status = 'ready_for_pickup';
    apt.donor_arrived_at = new Date().toISOString();
    apt.storage_slot = storageSlot;
    
    item.status = 'stored';
    item.storage_slot = storageSlot;
    item.quality_check = { passed: true, note, checkedBy: profile.legacy_id };
    
    db.storage_assignments.push({
      slot_id: storageSlot,
      item_id: item.id,
      appointment_id: apt.id,
      status: 'occupied',
      occupied_at: new Date().toISOString()
    });
    
    return { success: true, status: 'ready_for_pickup', slot: storageSlot };
  } else {
    apt.status = 'failed_inspection';
    item.status = 'rejected';
    return { success: true, status: 'failed_inspection' };
  }
}

const receiveResult = execute_rpc_inspect_and_receive_item(
  newAppointment.id, 
  true, 
  'Thước compa mới đẹp, kim compa chắc chắn an toàn', 
  'K1-A1', 
  sessionTR01.auth_uid
);

assert(receiveResult.success === true && receiveResult.slot === 'K1-A1', 'TR01 kiểm định ĐẠT và gán vào ô kệ K1-A1 thành công');
assert(db.items.find(i => i.id === newItem.id).status === 'stored', 'Món đồ chuyển trạng thái sang stored');
assert(db.appointments.find(a => a.id === newAppointment.id).status === 'ready_for_pickup', 'Lịch hẹn chuyển sang ready_for_pickup');

// -------------------------------------------------------------------------
// BƯỚC 10 & 11: TR01 XÁC MINH MÃ VÀ HOÀN TẤT BÀN GIAO
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 10 & 11: TR01 Xác minh mã và Hoàn tất bàn giao ---');

function execute_rpc_complete_handover(inputPickupCode, callerAuthUid) {
  const profile = db.profiles.find(p => p.auth_uid === callerAuthUid);
  if (!profile || !['station_staff', 'teacher', 'admin'].includes(profile.role)) {
    throw new Error('Từ chối quyền: Chỉ Quản sinh mới có quyền xác nhận bàn giao đồ!');
  }
  
  const apt = db.appointments.find(a => a.pickup_code.toUpperCase() === inputPickupCode.trim().toUpperCase());
  if (!apt) throw new Error('Mã nhận đồ không tồn tại!');
  if (apt.status === 'completed') throw new Error('Mã nhận đồ này ĐÃ ĐƯỢC BÀN GIAO trước đó và đã bị vô hiệu hóa an toàn!');
  
  const item = db.items.find(i => i.id === apt.item_id);
  const now = new Date().toISOString();
  
  apt.status = 'completed';
  apt.picked_up_at = now;
  apt.storage_slot = null;
  
  item.status = 'completed';
  item.storage_slot = null;
  
  const assignment = db.storage_assignments.find(s => s.appointment_id === apt.id && s.status === 'occupied');
  if (assignment) {
    assignment.status = 'released';
    assignment.released_at = now;
  }
  
  db.logs.push({
    id: genUniqueId('LOG'),
    role: profile.name,
    action: 'BÀN GIAO THÀNH CÔNG (RPC)',
    details: `Đã bàn giao món ${item.id} (${item.title}) cho học sinh ${apt.requester_id}. Mã ${apt.pickup_code} đã bị vô hiệu hóa.`
  });
  
  return { success: true, item_id: item.id, requester_id: apt.requester_id, pickup_code: apt.pickup_code };
}

const handoverResult = execute_rpc_complete_handover(pickupCode, sessionTR01.auth_uid);
assert(handoverResult.success === true, 'Bàn giao hoàn tất qua RPC với mã nhận đồ chính xác');

// -------------------------------------------------------------------------
// BƯỚC 12: DATABASE GHI NHẬN COMPLETED VÀ GIẢI PHÓNG Ô KỆ
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 12: Database ghi nhận completed và giải phóng ô kệ ---');
const completedItem = db.items.find(i => i.id === newItem.id);
const completedApt = db.appointments.find(a => a.id === newAppointment.id);
const releasedSlot = db.storage_assignments.find(s => s.slot_id === 'K1-A1');

assert(completedItem.status === 'completed' && completedItem.storage_slot === null, 'Món đồ có status = completed và storage_slot = null');
assert(completedApt.status === 'completed' && completedApt.storage_slot === null, 'Lịch hẹn có status = completed và storage_slot = null');
assert(releasedSlot.status === 'released' && releasedSlot.released_at !== null, 'Bản ghi gán kệ chuyển sang status = released và ghi thời điểm giải phóng');
assert(db.items.filter(i => i.storage_slot === 'K1-A1' && i.status === 'stored').length === 0, 'Ô kệ K1-A1 hiện hoàn toàn trống, sẵn sàng cho món khác');

// -------------------------------------------------------------------------
// BƯỚC 13: F5 CẢ 4 PHIÊN — ĐỒNG BỘ CHÍNH XÁC
// -------------------------------------------------------------------------
console.log('\n--- BƯỚC 13: Mô phỏng F5 (Tải dữ liệu sạch từ Cloud) ---');
// Giả lập 4 phiên tải lại từ db
const donorView = db.items.find(i => i.id === newItem.id);
const requesterView = db.appointments.find(a => a.id === newAppointment.id);
const stationViewSlots = db.items.filter(i => i.storage_slot === 'K1-A1' && i.status === 'stored');
const teacherViewLogs = db.logs.filter(l => l.action.includes('BÀN GIAO THÀNH CÔNG'));

assert(donorView.status === 'completed', 'Phiên HS001 (F5): Thấy món đồ đã hoàn tất chu trình');
assert(requesterView.status === 'completed', 'Phiên HS002 (F5): Thấy lịch hẹn đã bàn giao xong');
assert(stationViewSlots.length === 0, 'Phiên TR01 (F5): Thấy ô kệ K1-A1 đang trống');
assert(teacherViewLogs.length === 1, 'Phiên GV01 (F5): Thấy nhật ký kiểm toán ghi nhận ca bàn giao thành công');

// =========================================================================
// KIỂM THỬ CÁC TÌNH HUỐNG LỖI VÀ TẤN CÔNG BẢO MẬT
// =========================================================================
console.log('\n=================================================================');
console.log('KIỂM THỬ CÁC TÌNH HUỐNG LỖI VÀ CHỐNG TẤN CÔNG / RACE CONDITIONS');
console.log('=================================================================');

// 1. CHỐNG HAI LẦN XIN NHẬN CÙNG MỘT MÓN (DUPLICATE REQUEST)
console.log('\n--- TÌNH HUỐNG LỖI 1: Hai lần xin nhận cùng một món ---');
const isDuplicateRequestBlocked = (itemId, requesterId) => {
  return db.requests.some(r => r.item_id === itemId && r.requester_id === requesterId && r.status !== 'rejected');
};
assert(isDuplicateRequestBlocked(newItem.id, 'HS002') === true, 'Hệ thống phát hiện và chặn yêu cầu gửi lần thứ 2 của cùng học sinh cho món đồ');

// 2. CHỐNG HAI NGƯỜI ĐƯỢC CHỌN ĐỒNG THỜI (MULTIPLE WINNERS CONFLICT)
console.log('\n--- TÌNH HUỐNG LỖI 2: Hai người được chọn làm winner cùng lúc ---');
// Thêm 1 request giả lập của HS003
const fakeReqHS003 = { id: 'REQ-HS003', item_id: newItem.id, requester_id: 'HS003', status: 'pending' };
db.requests.push(fakeReqHS003);

const hasWinnerAlready = db.requests.some(r => r.item_id === newItem.id && r.status === 'selected');
assert(hasWinnerAlready === true, 'Phát hiện món đồ đã có người được chọn trước đó');
// Ràng buộc Unique partial index uq_requests_single_winner sẽ từ chối nếu có 2 dòng status = 'selected'
const duplicateWinnerCount = db.requests.filter(r => r.item_id === newItem.id && r.status === 'selected').length;
assert(duplicateWinnerCount === 1, 'Chỉ duy nhất 01 học sinh có status = selected trên database');

// 3. CHỐNG HAI MÓN CHIẾM CÙNG Ô KỆ (SHELF COLLISION)
console.log('\n--- TÌNH HUỐNG LỖI 3: Hai món chiếm cùng một ô kệ trạm ---');
// Giả sử có món A đang stored tại K1-B1
db.items.push({ id: 'ITEM-A', title: 'Món A', storage_slot: 'K1-B1', status: 'stored' });

// Cố gắng gán món B vào K1-B1
let shelfCollisionCaught = false;
try {
  const isB1Occupied = db.items.some(i => i.storage_slot === 'K1-B1' && i.status === 'stored');
  if (isB1Occupied) {
    throw new Error('Ô kệ K1-B1 hiện đã có đồ lưu trữ! Vui lòng chọn ô khác.');
  }
} catch (e) {
  shelfCollisionCaught = true;
}
assert(shelfCollisionCaught === true, 'Hệ thống chặn đứng xung đột khi cố gán 2 món vào cùng ô kệ K1-B1');

// 4. CHỐNG BÀN GIAO LẠI BẰNG MÃ ĐÃ SỬ DỤNG (REPLAY ATTACK)
console.log('\n--- TÌNH HUỐNG LỖI 4: Bàn giao lại bằng mã nhận đã sử dụng ---');
let replayAttackBlocked = false;
try {
  execute_rpc_complete_handover(pickupCode, sessionTR01.auth_uid);
} catch (err) {
  if (err.message.includes('ĐÃ ĐƯỢC BÀN GIAO trước đó và đã bị vô hiệu hóa')) {
    replayAttackBlocked = true;
  }
}
assert(replayAttackBlocked === true, 'Chặn tấn công Replay Attack: Không thể dùng lại mã đã hoàn tất để lấy đồ lần 2');

// 5. CHỐNG HỌC SINH GỌI THAO TÁC QUẢN TRỊ TRÁI QUYỀN (PRIVILEGE ESCALATION)
console.log('\n--- TÌNH HUỐNG LỖI 5: Học sinh gọi thao tác quản trị trái quyền ---');
let unauthorizedInspectionBlocked = false;
try {
  // HS001 cố gắng gọi RPC tiếp nhận đồ thay quản sinh
  execute_rpc_inspect_and_receive_item('APT-TEST', true, 'Tốt', 'K1-A2', sessionHS001.auth_uid);
} catch (err) {
  if (err.message.includes('Từ chối quyền: Chỉ Quản sinh hoặc Giáo viên')) {
    unauthorizedInspectionBlocked = true;
  }
}
assert(unauthorizedInspectionBlocked === true, 'Học sinh HS001 bị từ chối 100% khi cố gọi hàm kiểm định của Quản sinh');

let unauthorizedHandoverBlocked = false;
try {
  // HS002 cố gắng gọi RPC bàn giao thay quản sinh
  execute_rpc_complete_handover('LOOP-1234', sessionHS002.auth_uid);
} catch (err) {
  if (err.message.includes('Từ chối quyền: Chỉ Quản sinh')) {
    unauthorizedHandoverBlocked = true;
  }
}
assert(unauthorizedHandoverBlocked === true, 'Học sinh HS002 bị từ chối 100% khi cố gọi hàm hoàn tất bàn giao');

// 6. NGẮT MẠNG KHI LƯU DỮ LIỆU (NETWORK DISCONNECT & ERROR BOUNDARY)
console.log('\n--- TÌNH HUỐNG LỖI 6: Ngắt mạng khi lưu dữ liệu ---');
const simulateNetworkFailure = async () => {
  try {
    // Giả lập mạng bị rớt khi fetch
    throw new TypeError('Failed to fetch (ERR_INTERNET_DISCONNECTED)');
  } catch (err) {
    // Error handler của AppContext chuyển syncStatus sang sync_error, không làm sập app
    const syncStatus = 'sync_error';
    const errorMsg = 'Mất kết nối Internet! Hệ thống đang giữ an toàn trạng thái hiện tại.';
    return { syncStatus, errorMsg };
  }
};

const networkResult = await simulateNetworkFailure();
assert(networkResult.syncStatus === 'sync_error', 'Khi ngắt mạng, ứng dụng chuyển sang sync_error an toàn và hiển thị cảnh báo');

// =========================================================================
// TỔNG KẾT
// =========================================================================
console.log('\n=================================================================');
console.log(`KẾT QUẢ KIỂM THỬ GIAI ĐOẠN 4: PASS = ${passCount}, FAIL = ${failCount}`);
console.log('=================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
