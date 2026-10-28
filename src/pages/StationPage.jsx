import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { STORAGE_SLOTS, STATION_SLOTS } from '../data/seedData';
import {
  Warehouse,
  CheckCircle2,
  Clock,
  Layers,
  Info,
  Calendar,
  AlertTriangle,
  UserCheck,
  Package,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function StationPage({ setActivePage, setSelectedItem }) {
  const { items, appointments } = useApp();
  const [selectedSlotDetails, setSelectedSlotDetails] = useState(null);

  // Lấy danh sách các món đang lưu tại trạm
  const storedItems = items.filter(i => i.status === 'stored' && i.storageSlot);

  // Tạo map thông tin ô kệ
  const slotMap = {};
  STORAGE_SLOTS.forEach(slot => {
    slotMap[slot] = {
      slotId: slot,
      isOccupied: false,
      item: null,
      appointment: null
    };
  });

  storedItems.forEach(item => {
    if (slotMap[item.storageSlot]) {
      const apt = appointments.find(a => a.itemId === item.id);
      slotMap[item.storageSlot] = {
        slotId: item.storageSlot,
        isOccupied: true,
        item: item,
        appointment: apt
      };
    }
  });

  const rowA = ['K1-A1', 'K1-A2', 'K1-A3', 'K1-A4', 'K1-A5'];
  const rowB = ['K1-B1', 'K1-B2', 'K1-B3', 'K1-B4', 'K1-B5'];

  return (
    <div className="space-y-10 pb-20 max-w-6xl mx-auto">
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Cơ sở vật chất trạm thực nghiệm KHKT
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900">
          Trạm Lê Lợi Loop & Kệ lưu trữ K1
        </h1>
        <p className="text-xs sm:text-sm text-gray-500">
          Mô hình kết hợp "Bàn trực trực tiếp" và "Kệ lưu giữ tạm thời 10 ngăn" đặt tại Phòng Đoàn Đội THCS Lê Lợi, giải quyết vấn đề lệch ca sáng/chiều giữa các khối lớp.
        </p>
      </div>

      {/* 2 MÔ HÌNH VẬN HÀNH CỐT LÕI */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border-2 border-emerald-200 p-6 shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            1
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Mô hình 1: Trao nhận trực tiếp (Cùng ca)
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Áp dụng khi cả 2 học sinh cùng rảnh vào 1 khung giờ trực trạm (ví dụ cùng giờ ra chơi sáng hoặc chiều). Hai bạn gặp nhau tại Bàn trực trạm, tình nguyện viên CLB đối chiếu thông tin và giám sát việc trao nhận diễn ra tức thì, không cần lưu kệ.
          </p>
          <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block">
            Ưu điểm: Tối ưu thời gian, không chiếm sức chứa ô kệ trạm (0 slot).
          </div>
        </div>

        <div className="bg-white rounded-3xl border-2 border-teal-200 p-6 shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
            2
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Mô hình 2: Trao nhận qua lưu giữ tạm thời (Khác ca)
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Giải quyết nút thắt then chốt khi Người cho học ca Sáng còn Người nhận học ca Chiều. Người cho mang đồ tới gửi Đội trực trạm trước. Đội trực kiểm định chất lượng, đánh mã và xếp vào 1 ô kệ K1. Người nhận đến lấy vào ca sau (lưu tối đa 3 ngày).
          </p>
          <div className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 inline-block">
            Giới hạn quy chuẩn: Tối đa 10 món cùng lúc, thời hạn giữ tối đa 3 ngày học.
          </div>
        </div>
      </div>

      {/* SƠ ĐỒ TRỰC QUAN KỆ LƯU TRỮ K1 (10 Ô) */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-200">
              <Warehouse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Sơ đồ trạng thái Kệ K1 (10 ô sức chứa)
              </h2>
              <p className="text-xs text-gray-500">
                Nhấp vào ô kệ để xem chi tiết món đồ đang được bảo quản bên trong
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 border border-emerald-400"></span>
              <span className="text-gray-600">Đang trống ({10 - storedItems.length} ô)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-600"></span>
              <span className="text-gray-900">Đang lưu giữ ({storedItems.length} ô)</span>
            </div>
          </div>
        </div>

        {/* Layout tủ kệ K1 2 tầng */}
        <div className="bg-gradient-to-b from-stone-100 to-stone-200 p-5 rounded-3xl border-4 border-stone-300 shadow-inner space-y-4">
          {/* Tầng trên (Row A) */}
          <div>
            <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Tầng A (Ngăn trên: K1-A1 đến K1-A5)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {rowA.map(slotId => {
                const data = slotMap[slotId];
                const isOccupied = data.isOccupied;
                const isSelected = selectedSlotDetails?.slotId === slotId;

                return (
                  <div
                    key={slotId}
                    onClick={() => setSelectedSlotDetails(data)}
                    className={`h-28 rounded-2xl p-3 border-2 flex flex-col justify-between cursor-pointer transition-all relative ${
                      isOccupied
                        ? 'bg-amber-50 border-amber-400 shadow-md hover:scale-105 ring-2 ring-amber-300'
                        : 'bg-white/80 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                    } ${isSelected ? 'ring-4 ring-emerald-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-gray-800">
                        {slotId}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-amber-500 animate-ping' : 'bg-gray-300'}`} />
                    </div>

                    {isOccupied ? (
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-amber-900 line-clamp-1">
                          {data.item?.title}
                        </div>
                        <div className="text-[9px] text-amber-700 font-mono">
                          {data.item?.id} • Chờ {data.appointment?.requesterId || 'người nhận'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400 text-center font-medium">
                        Ô trống sẵn sàng
                      </div>
                    )}

                    <div className="text-[9px] text-gray-400 text-right">
                      {isOccupied ? 'Bấm để xem' : 'Chưa có đồ'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tầng dưới (Row B) */}
          <div>
            <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Tầng B (Ngăn dưới: K1-B1 đến K1-B5)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {rowB.map(slotId => {
                const data = slotMap[slotId];
                const isOccupied = data.isOccupied;
                const isSelected = selectedSlotDetails?.slotId === slotId;

                return (
                  <div
                    key={slotId}
                    onClick={() => setSelectedSlotDetails(data)}
                    className={`h-28 rounded-2xl p-3 border-2 flex flex-col justify-between cursor-pointer transition-all relative ${
                      isOccupied
                        ? 'bg-amber-50 border-amber-400 shadow-md hover:scale-105 ring-2 ring-amber-300'
                        : 'bg-white/80 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50'
                    } ${isSelected ? 'ring-4 ring-emerald-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-gray-800">
                        {slotId}
                      </span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-amber-500 animate-ping' : 'bg-gray-300'}`} />
                    </div>

                    {isOccupied ? (
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-amber-900 line-clamp-1">
                          {data.item?.title}
                        </div>
                        <div className="text-[9px] text-amber-700 font-mono">
                          {data.item?.id} • Chờ {data.appointment?.requesterId || 'người nhận'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400 text-center font-medium">
                        Ô trống sẵn sàng
                      </div>
                    )}

                    <div className="text-[9px] text-gray-400 text-right">
                      {isOccupied ? 'Bấm để xem' : 'Chưa có đồ'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Slot Detailed Panel */}
        {selectedSlotDetails && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 animate-fadeIn space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <span>Vị trí ô kệ: <strong>{selectedSlotDetails.slotId}</strong></span>
                {selectedSlotDetails.isOccupied ? (
                  <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
                    Đang có đồ lưu giữ
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                    Ô kệ đang trống
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedSlotDetails(null)}
                className="text-xs text-emerald-800 font-semibold hover:underline"
              >
                Đóng chi tiết
              </button>
            </div>

            {selectedSlotDetails.isOccupied ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedSlotDetails.item?.image}
                    alt={selectedSlotDetails.item?.title}
                    className="w-16 h-16 rounded-xl object-cover ring-1 ring-emerald-300"
                  />
                  <div className="text-xs">
                    <h4 className="font-bold text-gray-900">{selectedSlotDetails.item?.title}</h4>
                    <p className="text-gray-600 mt-0.5">{selectedSlotDetails.item?.description}</p>
                    <div className="text-emerald-800 font-semibold mt-1">
                      Mã món: {selectedSlotDetails.item?.id} • Mã nhận: {selectedSlotDetails.appointment?.pickupCode}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedItem(selectedSlotDetails.item);
                    setActivePage('detail');
                  }}
                  className="text-xs bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl hover:bg-emerald-800 transition-colors shrink-0"
                >
                  Xem chi tiết món này
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-600">
                Vị trí ô kệ này hiện đang sạch sẽ, sẵn sàng để tiếp nhận món đồ lưu giữ tiếp theo khi giáo viên hoặc đội trực trạm hoàn tất khâu kiểm tra thực tế.
              </p>
            )}
          </div>
        )}
      </div>

      {/* DANH SÁCH MÓN ĐANG LƯU TẠI TRẠM */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">
          Danh sách hiện vật đang lưu tại Trạm Lê Lợi Loop
        </h2>

        {storedItems.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            Hiện tại không có món đồ nào đang phải lưu giữ qua ca.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {storedItems.map(item => {
              const apt = appointments.find(a => a.itemId === item.id);
              const rSlot = STATION_SLOTS.find(s => s.id === apt?.requesterSlot);

              return (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 rounded-xl object-cover ring-1 ring-gray-200"
                    />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{item.title}</span>
                        <span className="font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                          Ô: {item.storageSlot}
                        </span>
                      </div>
                      <div className="text-gray-500 mt-0.5">
                        Người gửi: {item.donorName} • Người nhận hẹn: {apt?.requesterId || 'Chưa gán'} ({rSlot?.label})
                      </div>
                      <div className="text-emerald-700 font-semibold mt-0.5">
                        Mã nhận đồ: {apt?.pickupCode}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setActivePage('detail');
                    }}
                    className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl hover:bg-emerald-100 self-end sm:self-auto"
                  >
                    Xem hồ sơ món
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

