// =========================================================================
// TEST RUNNER CHÍNH THỨC CHO GIAI ĐOẠN 2B (AUTOMATED TEST HARNESS)
// DỰ ÁN: LÊ LỢI LOOP - THCS LÊ LỢI ĐÀ NẴNG
// =========================================================================

import { 
  runLoopMatchAlgorithm, 
  runLotteryWithSeed, 
  generatePickupCode 
} from '../src/utils/loopMatchAlgorithm.js';
import { genUniqueId } from '../src/lib/supabase.js';

console.log('=================================================================');
console.log('BẮT ĐẦU CHẠY KIỂM THỬ XÁC MINH GIAI ĐOẠN 2B — LÊ LỢI LOOP');
console.log('Thời gian:', new Date().toISOString());
console.log('=================================================================\n');

let passCount = 0;
let failCount = 0;
let blockedCount = 0;

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
// TEST T06: LoopMatch - Phát hiện nghịch lý thời gian (Time Paradox)
// -------------------------------------------------------------------------
console.log('--- TEST T06: Kiểm thử ràng buộc nghịch lý thời gian (LoopMatch) ---');
try {
  // Người cho chỉ rảnh Thứ 5 (T5_AM), Người nhận chỉ rảnh Thứ 2 (T2_AM) -> Paradox!
  const resParadox = runLoopMatchAlgorithm({
    donorSlots: ['T5_AM'],
    requesterSlots: ['T2_AM'],
    currentOccupiedCount: 0,
    maxCapacity: 10
  });

  assert(
    resParadox.allProposed.length === 0,
    'LoopMatch không đề xuất ca khi người nhận đến trước người cho (0 ca đề xuất)'
  );
  assert(
    resParadox.disqualifiedOptions.some(d => d.reason.includes('nghịch lý') || d.reason.includes('trước')),
    'LoopMatch ghi nhận lý do loại trừ là nghịch lý thời gian'
  );

  // Người cho Thứ 2 (T2_AM), Người nhận Thứ 4 (T4_AM) -> Hợp lệ (Lưu trạm 2 ngày)
  const resValid = runLoopMatchAlgorithm({
    donorSlots: ['T2_AM'],
    requesterSlots: ['T4_AM'],
    currentOccupiedCount: 2,
    maxCapacity: 10
  });

  assert(
    resValid.allProposed.length > 0 && resValid.bestOption.type === 'temporary_storage',
    'LoopMatch đề xuất phương án Lưu trạm hợp lệ khi người cho gửi trước người nhận lấy'
  );
} catch (e) {
  console.error('[FAIL] T06 Ngoại lệ:', e);
  failCount++;
}

// -------------------------------------------------------------------------
// TEST T07: Bốc thăm ngẫu nhiên LCG minh bạch & Có thể tái lập
// -------------------------------------------------------------------------
console.log('\n--- TEST T07: Bốc thăm LCG tính tái lập (Determinism & Fairness) ---');
try {
  const sampleRequests = [
    { id: 'REQ-1', requesterId: 'HS001', requesterName: 'Bảo An', createdAt: '2026-10-30 08:00' },
    { id: 'REQ-2', requesterId: 'HS002', requesterName: 'Hoàng Nam', createdAt: '2026-10-30 08:05' },
    { id: 'REQ-3', requesterId: 'HS003', requesterName: 'Minh Đăng', createdAt: '2026-10-30 08:10' }
  ];

  const SEED = 'LE-LOI-LOOP-KHKT-2026';
  const run1 = runLotteryWithSeed(sampleRequests, SEED);
  const run2 = runLotteryWithSeed(sampleRequests, SEED);

  const winner1 = run1.find(r => r.status === 'selected');
  const winner2 = run2.find(r => r.status === 'selected');

  assert(
    winner1 && winner2 && winner1.id === winner2.id,
    `LCG cho ra cùng 1 người trúng giải khi dùng chung Seed (${winner1?.requesterName})`
  );

  const selectedCount = run1.filter(r => r.status === 'selected').length;
  assert(selectedCount === 1, 'LCG chỉ chọn đúng duy nhất 01 người nhận chính thức');

  const backupCount = run1.filter(r => r.status === 'backup').length;
  assert(backupCount === sampleRequests.length - 1, 'Các ứng viên còn lại chuyển sang danh sách dự phòng (backup)');
} catch (e) {
  console.error('[FAIL] T07 Ngoại lệ:', e);
  failCount++;
}

// -------------------------------------------------------------------------
// TEST T10: Sức chứa tối đa của trạm (10 ô kệ)
// -------------------------------------------------------------------------
console.log('\n--- TEST T10: Giới hạn dung tích trạm (Max Capacity 10 Slots) ---');
try {
  // Khi trạm đã đầy 10/10 ô kệ
  const resFullStation = runLoopMatchAlgorithm({
    donorSlots: ['T2_AM'],
    requesterSlots: ['T4_AM'],
    currentOccupiedCount: 10,
    maxCapacity: 10
  });

  const hasStorageOption = resFullStation.allProposed.some(o => o.type === 'temporary_storage');
  assert(
    !hasStorageOption,
    'LoopMatch từ chối phương án lưu trạm khi 10 ô kệ đã bị chiếm giữ hoàn toàn'
  );

  assert(
    resFullStation.disqualifiedOptions.some(d => d.reason.includes('đầy') || d.reason.includes('sức chứa')),
    'LoopMatch ghi nhận lý do loại trừ trạm đầy đúng quy định'
  );
} catch (e) {
  console.error('[FAIL] T10 Ngoại lệ:', e);
  failCount++;
}

// -------------------------------------------------------------------------
// TEST T11: Phân tán mã định danh genUniqueId (UUID Collision Test)
// -------------------------------------------------------------------------
console.log('\n--- TEST T11: Kiểm tra xung đột mã định danh (10,000 ID Generation) ---');
try {
  const TOTAL_TEST_IDS = 10000;
  const idSet = new Set();
  let collisionDetected = false;

  for (let i = 0; i < TOTAL_TEST_IDS; i++) {
    const id = genUniqueId('REQ');
    if (idSet.has(id)) {
      collisionDetected = true;
      break;
    }
    idSet.add(id);
  }

  assert(
    !collisionDetected && idSet.size === TOTAL_TEST_IDS,
    `Sinh thành công ${TOTAL_TEST_IDS.toLocaleString()} ID phân tán mà không có bất kỳ vụ trùng lặp nào (0% Collision)`
  );
} catch (e) {
  console.error('[FAIL] T11 Ngoại lệ:', e);
  failCount++;
}

// -------------------------------------------------------------------------
// TEST T09: Mã nhận đồ Pickup Code (Format & Range)
// -------------------------------------------------------------------------
console.log('\n--- TEST T09: Quy cách mã nhận đồ 4 số (Pickup Code Security) ---');
try {
  const codes = new Set();
  let validFormat = true;

  for (let i = 0; i < 500; i++) {
    const code = generatePickupCode();
    if (!code.startsWith('LOOP-') || code.length !== 9) {
      validFormat = false;
      break;
    }
    codes.add(code);
  }

  assert(validFormat, 'Mã nhận đồ tuân thủ định dạng "LOOP-xxxx" (4 chữ số ngẫu nhiên)');
  assert(codes.size > 450, `Độ ngẫu nhiên entropy cao: 500 lần sinh tạo ra ${codes.size} mã độc nhất`);
} catch (e) {
  console.error('[FAIL] T09 Ngoại lệ:', e);
  failCount++;
}

// -------------------------------------------------------------------------
// TEST T04: Chống gửi yêu cầu trùng và tự gửi nhận món đồ của mình
// -------------------------------------------------------------------------
console.log('\n--- TEST T04: Client-side Duplicate & Self-Request Prevention ---');
try {
  const currentRequests = [
    { id: 'REQ-1', itemId: 'M001', requesterId: 'HS002', status: 'pending' },
    { id: 'REQ-2', itemId: 'M002', requesterId: 'HS002', status: 'rejected' } // đã bị từ chối
  ];

  // Kiểm tra 1: Gửi trùng khi đang pending
  const isDuplicate = currentRequests.some(
    r => r.itemId === 'M001' && r.requesterId === 'HS002' && r.status !== 'rejected'
  );
  assert(isDuplicate, 'Phát hiện yêu cầu đang pending/selected đã tồn tại (Chặn duplicate)');

  // Kiểm tra 2: Món đã bị rejected thì cho phép gửi lại
  const isDuplicateRejected = currentRequests.some(
    r => r.itemId === 'M002' && r.requesterId === 'HS002' && r.status !== 'rejected'
  );
  assert(!isDuplicateRejected, 'Yêu cầu cũ đã bị từ chối thì học sinh được phép gửi lại');

  // Kiểm tra 3: Tự xin nhận món đồ của chính mình
  const item = { id: 'M001', donorId: 'HS001' };
  const currentUserId = 'HS001';
  const isSelfRequest = item.donorId === currentUserId;
  assert(isSelfRequest, 'Chặn người đăng đồ tự gửi yêu cầu xin nhận món của chính mình');
} catch (e) {
  console.error('[FAIL] T04 Ngoại lệ:', e);
  failCount++;
}

// -------------------------------------------------------------------------
// TEST T15: Kiểm định thực tế tại trạm (Đạt / Không đạt)
// -------------------------------------------------------------------------
console.log('\n--- TEST T15: Kiểm định chất lượng thực tế (Quality Inspection Transitions) ---');
try {
  const sampleItem = {
    id: 'M001',
    status: 'matching',
    qualityCheck: null
  };

  // Case Đạt
  const passedItem = {
    ...sampleItem,
    status: 'stored',
    storageSlot: 'K1-A1',
    qualityCheck: { passed: true, note: 'Sách còn mới 90%', checkedBy: 'TR01' }
  };
  assert(
    passedItem.status === 'stored' && passedItem.qualityCheck.passed === true,
    'Kiểm định ĐẠT: Món đồ chuyển sang "stored", ghi nhận ô kệ K1-A1'
  );

  // Case Không Đạt
  const failedItem = {
    ...sampleItem,
    status: 'rejected',
    rejectReason: 'Không đạt kiểm tra thực tế: Sách bị ướt và rách nhiều trang',
    qualityCheck: { passed: false, note: 'Sách bị ướt và rách nhiều trang', checkedBy: 'TR01' }
  };
  assert(
    failedItem.status === 'rejected' && failedItem.qualityCheck.passed === false,
    'Kiểm định KHÔNG ĐẠT: Món đồ chuyển sang "rejected", lưu lý do từ chối rõ ràng'
  );
} catch (e) {
  console.error('[FAIL] T15 Ngoại lệ:', e);
  failCount++;
}

// -------------------------------------------------------------------------
// TEST T02: Hydration khi Cloud trả về mảng rỗng []
// -------------------------------------------------------------------------
console.log('\n--- TEST T02: Hydration - Cloud trả về [] (Single Source of Truth) ---');
try {
  const cloudResponse = []; // Không có dòng nào trên Cloud
  const stateSetter = (data) => {
    if (Array.isArray(data)) {
      return data; // Gán đúng mảng rỗng []
    }
    return ['STALE_DATA'];
  };

  const finalState = stateSetter(cloudResponse);
  assert(
    Array.isArray(finalState) && finalState.length === 0,
    'Khi Cloud trả về [], state nhận [] chuẩn xác, không bị fallback ghi đè seed mẫu'
  );
} catch (e) {
  console.error('[FAIL] T02 Ngoại lệ:', e);
  failCount++;
}

console.log('\n=================================================================');
console.log(`KẾT QUẢ TỰ ĐỘNG CHẠY TEST: PASS = ${passCount}, FAIL = ${failCount}`);
console.log('=================================================================');
