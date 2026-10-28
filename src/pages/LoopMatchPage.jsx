import React, { useState, useMemo } from 'react';
import { STATION_SLOTS } from '../data/seedData';
import { runLoopMatchAlgorithm } from '../utils/loopMatchAlgorithm';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  Sliders,
  Layers,
  Clock,
  Warehouse,
  ShieldCheck,
  Check,
  XCircle,
  RotateCcw
} from 'lucide-react';

export default function LoopMatchPage() {
  // Interactive inputs for testing algorithm
  const [donorSlots, setDonorSlots] = useState(['T2_PM', 'T3_PM', 'T4_PM']);
  const [requesterSlots, setRequesterSlots] = useState(['T3_PM', 'T5_AM']);
  const [occupiedCount, setOccupiedCount] = useState(2);
  const [maxCapacity, setMaxCapacity] = useState(10);
  const [maxDays, setMaxDays] = useState(3);

  const toggleDonorSlot = (slotId) => {
    setDonorSlots(prev => prev.includes(slotId) ? prev.filter(s => s !== slotId) : [...prev, slotId]);
  };

  const toggleRequesterSlot = (slotId) => {
    setRequesterSlots(prev => prev.includes(slotId) ? prev.filter(s => s !== slotId) : [...prev, slotId]);
  };

  // Chạy thuật toán LoopMatch
  const matchResult = useMemo(() => {
    return runLoopMatchAlgorithm({
      donorSlots,
      requesterSlots,
      currentOccupiedCount: occupiedCount,
      maxCapacity,
      maxDays
    });
  }, [donorSlots, requesterSlots, occupiedCount, maxCapacity, maxDays]);

  return (
    <div className="space-y-10 pb-24 max-w-5xl mx-auto">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Trọng tâm Nghiên cứu Khoa học Kỹ thuật
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          Thuật toán Điều phối LoopMatch
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Mô hình toán học & thuật toán tối ưu hóa đa mục tiêu giải quyết bài toán ghép nối thời gian giữa học sinh 2 ca sáng - chiều và kiểm soát sức chứa giới hạn của trạm.
        </p>
      </div>

      {/* 3 BƯỚC LOGIC THUẬT TOÁN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-xs">
            B1
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Tìm ca giao nhau (Trực tiếp)</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Xét tập hợp giao: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-emerald-800">S = S_donor ∩ S_receiver</code>. Nếu <code className="font-mono">S ≠ ∅</code>, đề xuất ngay phương án <strong>Trao nhận trực tiếp</strong> với chi phí kệ = 0.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-extrabold flex items-center justify-center text-xs">
            B2
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Kiểm tra điều kiện biên lưu trạm</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Với các cặp lệch ca: Kiểm tra <code className="font-mono text-emerald-800">t_donor &lt; t_receiver</code>, độ chênh ngày <code className="font-mono text-emerald-800">Δd ≤ 3</code> và sức chứa hiện tại <code className="font-mono text-emerald-800">C_t &lt; 10</code>.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm space-y-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-600 text-white font-extrabold flex items-center justify-center text-xs">
            B3
          </div>
          <h3 className="font-bold text-gray-900 text-sm">Hàm mục tiêu xếp hạng (Score)</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Tính điểm <code className="font-mono text-emerald-800">F = w1·Type - w2·RecvTime - w3·StorageDays</code>. Ưu tiên ngày nhận sớm nhất và thời gian chiếm dụng kệ ngắn nhất.
          </p>
        </div>
      </div>

      {/* KHUNG THỰC NGHIỆM TƯƠNG TÁC (INTERACTIVE SOLVER) */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">
              Mô phỏng thử nghiệm thuật toán tương tác
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl border border-emerald-200 font-bold">
            <span>Thời gian xử lý:</span>
            <strong>{matchResult.executionTimeMs} ms</strong>
          </div>
        </div>

        {/* INPUTS SELECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cột 1: Ca người cho */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800">
                1. Chọn ca rảnh của Người Cho (Donor):
              </label>
              <span className="text-[11px] font-semibold text-emerald-700">
                {donorSlots.length} ca đã chọn
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-3 rounded-2xl bg-gray-50 border border-gray-200 max-h-52 overflow-y-auto">
              {STATION_SLOTS.map(slot => {
                const isSelected = donorSlots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleDonorSlot(slot.id)}
                    className={`text-left text-xs p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cột 2: Ca người nhận */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800">
                2. Chọn ca rảnh của Người Nhận (Requester):
              </label>
              <span className="text-[11px] font-semibold text-blue-700">
                {requesterSlots.length} ca đã chọn
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-3 rounded-2xl bg-gray-50 border border-gray-200 max-h-52 overflow-y-auto">
              {STATION_SLOTS.map(slot => {
                const isSelected = requesterSlots.includes(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleRequesterSlot(slot.id)}
                    className={`text-left text-xs p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* THAM SỐ ĐIỀU KIỆN BIÊN TRẠM */}
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Số ô trạm đang bị chiếm: <strong className="text-emerald-700">{occupiedCount}/10</strong>
            </label>
            <input
              type="range"
              min="0"
              max="10"
              value={occupiedCount}
              onChange={(e) => setOccupiedCount(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Sức chứa tối đa: <strong className="text-emerald-700">{maxCapacity} ô</strong>
            </label>
            <input
              type="range"
              min="5"
              max="15"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">
              Thời hạn lưu tối đa: <strong className="text-emerald-700">{maxDays} ngày học</strong>
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={maxDays}
              onChange={(e) => setMaxDays(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>

        {/* OUTPUT TRỰC QUAN CỦA GIẢI THUẬT */}
        <div className="space-y-4 pt-2">
          <div className="text-sm font-bold text-gray-900 flex items-center justify-between">
            <span>Kết quả phân tích phương án của LoopMatch ({matchResult.allProposed.length} phương án khả thi):</span>
            <span className="text-xs font-normal text-gray-500">
              Đã kiểm tra {matchResult.totalEvaluated} tổ hợp ca
            </span>
          </div>

          {/* Phương án 1 (Tối ưu nhất - thẻ xanh lá) */}
          {matchResult.bestOption ? (
            <div className="p-5 rounded-3xl bg-emerald-50 border-2 border-emerald-400 space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-200 px-3 py-1 rounded-full w-fit">
                  ⭐ Phương án 1 (TỐI ƯU NHẤT) – {matchResult.bestOption.typeName}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  Hệ số tối ưu: {matchResult.bestOption.score} pts
                </span>
              </div>

              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                {matchResult.bestOption.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-300">
                  <span className="text-gray-500 block text-[10px]">Ca gửi đồ:</span>
                  <strong className="text-emerald-950">{matchResult.bestOption.donorSlotInfo?.label}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-300">
                  <span className="text-gray-500 block text-[10px]">Ca nhận đồ:</span>
                  <strong className="text-emerald-950">{matchResult.bestOption.requesterSlotInfo?.label}</strong>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-300">
                  <span className="text-gray-500 block text-[10px]">Tài nguyên trạm tiêu hao:</span>
                  <strong className="text-emerald-950">{matchResult.bestOption.shelfUsage} ô kệ (Khoảng cách {matchResult.bestOption.dayDifference} ngày)</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
              <div className="font-bold text-red-900 text-sm">Không tìm thấy phương án hợp lệ!</div>
              <p className="text-xs text-red-700 max-w-md mx-auto">
                Tất cả các tổ hợp ca đều bị loại do vi phạm giới hạn lưu trữ tối đa ({maxDays} ngày) hoặc trạm đã đầy sức chứa.
              </p>
            </div>
          )}

          {/* Phương án 2 (Dự phòng) */}
          {matchResult.backupOption && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-blue-900 bg-blue-200 px-2.5 py-0.5 rounded">
                  Phương án 2 (Dự phòng) – {matchResult.backupOption.typeName}
                </span>
                <span className="text-xs font-mono text-blue-800">
                  Score: {matchResult.backupOption.score} pts
                </span>
              </div>
              <p className="text-xs text-blue-950">
                {matchResult.backupOption.description}
              </p>
            </div>
          )}

          {/* Các phương án bị loại kèm lý do cụ thể */}
          {matchResult.disqualifiedOptions.length > 0 && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
              <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-stone-500" />
                <span>Các phương án đã bị loại bỏ theo quy chuẩn KHKT ({matchResult.disqualifiedOptions.length}):</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {matchResult.disqualifiedOptions.slice(0, 5).map((opt, idx) => (
                  <div key={idx} className="text-xs bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between">
                    <span className="text-stone-800">
                      Gửi: <strong>{opt.donorSlotInfo?.label}</strong> ➔ Nhận: <strong>{opt.requesterSlotInfo?.label}</strong>
                    </span>
                    <span className="text-red-700 font-semibold text-[11px]">
                      {opt.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

