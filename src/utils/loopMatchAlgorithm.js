// THUẬT TOÁN ĐIỀU PHỐI GHÉP NỐI "LOOPMATCH"
// Đề tài KHKT: LÊ LỢI LOOP - THCS LÊ LỢI ĐÀ NẴNG

import { STATION_SLOTS } from '../data/seedData';

// Chuyển slot ID sang chỉ số tuần tự tuyến tính trong tuần học
// T2_AM -> 0, T2_PM -> 1, T3_AM -> 2, T3_PM -> 3, ..., T6_PM -> 9
export const getSlotOrder = (slotId) => {
  const index = STATION_SLOTS.findIndex(s => s.id === slotId);
  return index;
};

export const getSlotDetail = (slotId) => {
  return STATION_SLOTS.find(s => s.id === slotId) || null;
};

// Tính khoảng cách ngày học giữa 2 slot
export const calculateDayDifference = (donorSlotId, requesterSlotId) => {
  const donor = getSlotDetail(donorSlotId);
  const requester = getSlotDetail(requesterSlotId);
  if (!donor || !requester) return Infinity;
  return requester.dayIndex - donor.dayIndex;
};

/**
 * Hàm giải thuật LoopMatch
 * @param {Object} params
 * @param {string[]} params.donorSlots - Các ca người cho có thể gửi
 * @param {string[]} params.requesterSlots - Các ca người nhận có thể nhận
 * @param {number} params.currentOccupiedCount - Số ô kệ trạm hiện đang bị chiếm (tối đa 10)
 * @param {number} params.maxCapacity - Sức chứa tối đa (mặc định 10)
 * @param {number} params.maxDays - Thời hạn lưu trữ tối đa (mặc định 3 ngày học)
 */
export function runLoopMatchAlgorithm({
  donorSlots = [],
  requesterSlots = [],
  currentOccupiedCount = 1,
  maxCapacity = 10,
  maxDays = 3,
  slotOccupancyMap = {}
}) {
  const startTime = performance.now();

  const proposedOptions = [];
  const disqualifiedOptions = [];

  // Bước 1: Tìm ca chung -> Trao nhận trực tiếp
  for (const dSlot of donorSlots) {
    if (requesterSlots.includes(dSlot)) {
      const slotInfo = getSlotDetail(dSlot);
      if (slotInfo) {
        proposedOptions.push({
          type: 'direct',
          typeName: 'Trao nhận trực tiếp (Cùng ca)',
          donorSlot: dSlot,
          requesterSlot: dSlot,
          donorSlotInfo: slotInfo,
          requesterSlotInfo: slotInfo,
          dayDifference: 0,
          shelfUsage: 0,
          score: 1000 - getSlotOrder(dSlot) * 10, // Ưu tiên ca sớm trong tuần
          description: `Cả người cho và người nhận đều rảnh vào ${slotInfo.label}. Hai bạn gặp nhau tại bàn trực Trạm để trao đồ trực tiếp dưới sự giám sát của Đội trực CLB.`
        });
      }
    }
  }

  // Bước 2: Tìm các cặp ca gửi trước - ca nhận sau -> Trao nhận qua lưu giữ tạm thời
  for (const dSlot of donorSlots) {
    const dOrder = getSlotOrder(dSlot);
    const dInfo = getSlotDetail(dSlot);
    if (dOrder === -1 || !dInfo) continue;

    for (const rSlot of requesterSlots) {
      const rOrder = getSlotOrder(rSlot);
      const rInfo = getSlotDetail(rSlot);
      if (rOrder === -1 || !rInfo) continue;

      // Không xét lại trường hợp trùng ca (đã xử lý ở bước 1)
      if (dSlot === rSlot) continue;

      const dayDiff = calculateDayDifference(dSlot, rSlot);

      // Trường hợp ca nhận diễn ra TRƯỚC ca gửi -> Nghịch lý thời gian
      if (rOrder < dOrder) {
        disqualifiedOptions.push({
          donorSlot: dSlot,
          requesterSlot: rSlot,
          donorSlotInfo: dInfo,
          requesterSlotInfo: rInfo,
          reason: 'Lỗi nghịch lý thời gian: Ca nhận diễn ra trước ca gửi.',
          code: 'TIME_PARADOX'
        });
        continue;
      }

      // Kiểm tra vi phạm thời hạn lưu trữ (> maxDays ngày học)
      if (dayDiff > maxDays) {
        disqualifiedOptions.push({
          donorSlot: dSlot,
          requesterSlot: rSlot,
          donorSlotInfo: dInfo,
          requesterSlotInfo: rInfo,
          reason: `Vượt quá thời hạn lưu trữ tối đa (${dayDiff} ngày > ${maxDays} ngày quy định).`,
          code: 'MAX_DAYS_EXCEEDED',
          dayDifference: dayDiff
        });
        continue;
      }

      // Kiểm tra sức chứa kệ trạm
      // Dự kiến số lượng đồ lưu tạm tại thời điểm này
      const projectedOccupancy = (slotOccupancyMap[dSlot] || currentOccupiedCount);
      if (projectedOccupancy >= maxCapacity) {
        disqualifiedOptions.push({
          donorSlot: dSlot,
          requesterSlot: rSlot,
          donorSlotInfo: dInfo,
          requesterSlotInfo: rInfo,
          reason: `Trạm hết sức chứa lưu trữ (${projectedOccupancy}/${maxCapacity} ô đã có đồ).`,
          code: 'CAPACITY_EXCEEDED'
        });
        continue;
      }

      // Đạt chuẩn -> Tạo đề xuất lưu tạm
      // Tính điểm số ưu tiên:
      // Điểm càng cao càng tốt:
      // - Ngày nhận càng sớm càng tốt (ưu tiên người nhận có đồ dùng học tập ngay)
      // - Thời gian lưu trữ càng ngắn càng tốt (tiết kiệm không gian ô kệ)
      const slotDiff = rOrder - dOrder;
      const score = 800 - (rOrder * 20) - (slotDiff * 15);

      let durationText = '';
      if (dayDiff === 0) {
        durationText = 'Lưu trong ngày (Sáng gửi - Chiều nhận)';
      } else {
        durationText = `Lưu giữ tạm ${dayDiff} ngày học tại kệ trạm`;
      }

      proposedOptions.push({
        type: 'temporary_storage',
        typeName: 'Trao nhận qua lưu giữ tạm thời (Khác ca)',
        donorSlot: dSlot,
        requesterSlot: rSlot,
        donorSlotInfo: dInfo,
        requesterSlotInfo: rInfo,
        dayDifference: dayDiff,
        shelfUsage: 1,
        score: score,
        description: `Người cho gửi đồ vào ${dInfo.label}. Đội trực kiểm tra và cất tại kệ lưu trữ. Người nhận đến lấy vào ${rInfo.label} (${durationText}).`
      });
    }
  }

  // Bước 3: Sắp xếp xếp hạng các phương án tối ưu
  proposedOptions.sort((a, b) => b.score - a.score);

  const bestOption = proposedOptions[0] || null;
  const backupOption = proposedOptions[1] || null;
  const remainingOptions = proposedOptions.slice(2);

  const endTime = performance.now();
  const executionTimeMs = parseFloat((endTime - startTime).toFixed(4));

  return {
    bestOption,
    backupOption,
    otherOptions: remainingOptions,
    allProposed: proposedOptions,
    disqualifiedOptions,
    totalEvaluated: proposedOptions.length + disqualifiedOptions.length,
    executionTimeMs
  };
}

// Hàm sinh mã nhận đồ ngẫu nhiên bảo mật (Ví dụ LOOP-8472)
export function generatePickupCode() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `LOOP-${randomNum}`;
}

// Hàm bốc thăm ngẫu nhiên với Fixed Seed (cho mục đích minh bạch, khách quan trong KHKT)
export function runLotteryWithSeed(requests, seedString = 'LE-LOI-LOOP-KHKT-2026') {
  if (!requests || requests.length === 0) return [];

  // Tạo hàm băm ngẫu nhiên có seed
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }

  // Pseudo-random generator (LCG)
  const lcg = (s) => {
    return function() {
      s = Math.imul(1664525, s) + 1013904223 | 0;
      return (s >>> 0) / 4294967296;
    };
  };

  const random = lcg(Math.abs(hash));

  // Trộn mảng Fisher-Yates
  const shuffled = [...requests];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Gán thứ hạng
  return shuffled.map((req, idx) => ({
    ...req,
    lotteryRank: idx + 1,
    status: idx === 0 ? 'selected' : 'backup'
  }));
}

