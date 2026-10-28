import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, STATION_SLOTS } from '../data/seedData';
import {
  Package,
  Heart,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  ArrowRight,
  Eye,
  Warehouse,
  ExternalLink,
  ShieldCheck,
  Tag
} from 'lucide-react';

export default function MyActivityPage({ setActivePage, setSelectedItem }) {
  const { currentUser, items, requests, appointments } = useApp();
  const [activeTab, setActiveTab] = useState('appointments'); // 'posted' | 'requests' | 'appointments'

  // 1. Món do user hiện tại đăng
  const myPostedItems = items.filter(i => i.donorId === currentUser.id);

  // 2. Yêu cầu do user hiện tại gửi
  const myRequests = requests.filter(r => r.requesterId === currentUser.id);

  // 3. Lịch hẹn liên quan đến user (là người cho hoặc người nhận)
  const myAppointments = appointments.filter(
    a => a.donorId === currentUser.id || a.requesterId === currentUser.id
  );

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Header Profile Summary */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-emerald-500 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-gray-900">{currentUser.name}</h1>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                {currentUser.id}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Lớp {currentUser.class} • Buổi học: <strong>{currentUser.shift}</strong> • Điểm tích lũy trao nhận: <strong className="text-emerald-700">{currentUser.points} điểm</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setActivePage('donate')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
        >
          <span>Đăng thêm món mới</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3 TABS CHÍNH */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'appointments'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Lịch hẹn sắp tới</span>
          <span className={`text-xs px-2 py-0.2 rounded-full font-bold ${activeTab === 'appointments' ? 'bg-white text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
            {myAppointments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'requests'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Yêu cầu nhận</span>
          <span className={`text-xs px-2 py-0.2 rounded-full font-bold ${activeTab === 'requests' ? 'bg-white text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
            {myRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('posted')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'posted'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Món đã đăng</span>
          <span className={`text-xs px-2 py-0.2 rounded-full font-bold ${activeTab === 'posted' ? 'bg-white text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
            {myPostedItems.length}
          </span>
        </button>
      </div>

      {/* TAB 1: LỊCH HẸN SẮP TỚI */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          {myAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-2">
              <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
              <div className="text-sm font-bold text-gray-700">Chưa có lịch hẹn trao nhận nào</div>
              <p className="text-xs text-gray-500">
                Khi các yêu cầu của bạn được xét duyệt và chốt lịch qua LoopMatch, thông tin thẻ hẹn và mã QR sẽ xuất hiện ở đây.
              </p>
            </div>
          ) : (
            myAppointments.map(apt => {
              const item = items.find(i => i.id === apt.itemId);
              const isDonor = apt.donorId === currentUser.id;
              const isRequester = apt.requesterId === currentUser.id;
              const dSlot = STATION_SLOTS.find(s => s.id === apt.donorSlot);
              const rSlot = STATION_SLOTS.find(s => s.id === apt.requesterSlot);

              return (
                <div
                  key={apt.id}
                  className="bg-white border-2 border-emerald-300/80 rounded-3xl p-6 shadow-md relative overflow-hidden space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                        {apt.id}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        apt.type === 'direct'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {apt.type === 'direct' ? 'Trao nhận trực tiếp' : 'Trao nhận qua lưu trạm'}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        apt.status === 'completed'
                          ? 'bg-gray-100 text-gray-700'
                          : apt.status === 'ready_for_pickup'
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status === 'completed'
                          ? 'Đã hoàn tất'
                          : apt.status === 'ready_for_pickup'
                          ? 'Đã có đồ tại trạm - Sẵn sàng nhận'
                          : 'Đã xếp lịch hẹn'}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-emerald-800">
                      Vai trò của bạn: <strong>{isDonor ? 'Người trao tặng' : 'Người tiếp nhận'}</strong>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Item summary */}
                    <div className="md:col-span-4 flex items-center gap-3">
                      <img
                        src={item?.image}
                        alt={item?.title}
                        className="w-16 h-16 rounded-xl object-cover ring-1 ring-gray-200 shrink-0"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-gray-900 line-clamp-1">{item?.title}</div>
                        <div className="text-gray-500">Mã món: {item?.id}</div>
                        <div className="text-emerald-700 font-semibold">{item?.condition}</div>
                      </div>
                    </div>

                    {/* Schedule times */}
                    <div className="md:col-span-5 space-y-1.5 text-xs bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 w-24">Ca người cho:</span>
                        <span className="text-gray-900 font-semibold bg-white px-2 py-0.5 rounded border border-gray-200">
                          {dSlot?.label || apt.donorSlot}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 w-24">Ca người nhận:</span>
                        <span className="text-gray-900 font-semibold bg-white px-2 py-0.5 rounded border border-gray-200">
                          {rSlot?.label || apt.requesterSlot}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 pt-1">
                        Địa điểm: <strong>Bàn trực Trạm Lê Lợi Loop (Phòng Đội THCS Lê Lợi)</strong>
                        {apt.storageSlot && (
                          <span className="block text-teal-800 font-bold">
                            Vị trí ô kệ lưu: {apt.storageSlot}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pickup Pass Card / QR Code */}
                    <div className="md:col-span-3 bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-200">
                        <QrCode className="w-3.5 h-3.5" />
                        Mã nhận đồ KHKT
                      </div>

                      <div className="bg-white text-gray-950 font-mono font-black text-lg tracking-wider px-3 py-1.5 rounded-xl shadow-inner border border-emerald-400">
                        {apt.pickupCode}
                      </div>

                      {/* Mock QR visual representation */}
                      <div className="w-14 h-14 bg-white p-1 rounded-lg flex items-center justify-center">
                        <div className="grid grid-cols-3 gap-0.5 w-full h-full p-0.5 bg-black rounded-sm">
                          <div className="bg-white rounded-[1px]"></div>
                          <div className="bg-black"></div>
                          <div className="bg-white rounded-[1px]"></div>
                          <div className="bg-black"></div>
                          <div className="bg-white rounded-[1px]"></div>
                          <div className="bg-black"></div>
                          <div className="bg-white rounded-[1px]"></div>
                          <div className="bg-black"></div>
                          <div className="bg-white rounded-[1px]"></div>
                        </div>
                      </div>

                      <div className="text-[10px] text-emerald-100">
                        {apt.status === 'completed' ? 'Mã đã được vô hiệu hóa' : 'Đưa mã này cho Đội trực trạm khi nhận'}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {apt.notes && (
                    <div className="text-[11px] bg-amber-50 text-amber-900 p-2.5 rounded-xl border border-amber-200">
                      <strong>Ghi chú điều phối:</strong> {apt.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: YÊU CẦU NHẬN CỦA TÔI */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {myRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-2">
              <Heart className="w-10 h-10 text-gray-300 mx-auto" />
              <div className="text-sm font-bold text-gray-700">Bạn chưa gửi yêu cầu nhận món đồ nào</div>
              <p className="text-xs text-gray-500">
                Hãy ghé thăm Kho đồ để tìm những cuốn sách, balo hay đồ dùng học tập bạn đang cần.
              </p>
              <button
                onClick={() => setActivePage('catalog')}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl"
              >
                Khám phá kho đồ ngay
              </button>
            </div>
          ) : (
            myRequests.map(req => {
              const item = items.find(i => i.id === req.itemId);
              const apt = appointments.find(a => a.requestId === req.id);

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="text-xs text-gray-500">Gửi lúc: {req.createdAt}</span>
                    </div>

                    {/* Request Status Badge */}
                    <div className="flex items-center gap-2">
                      {req.status === 'pending' && (
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Chờ xét duyệt
                        </span>
                      )}
                      {req.status === 'selected' && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã được chọn chính thức
                        </span>
                      )}
                      {req.status === 'backup' && (
                        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full">
                          Danh sách dự phòng
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item?.image}
                        alt={item?.title}
                        className="w-14 h-14 rounded-xl object-cover ring-1 ring-gray-200 shrink-0"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">{item?.title || req.itemId}</h4>
                        <div className="text-xs text-gray-500">
                          Người tặng: {item?.donorName || item?.donorId} • Tình trạng: {item?.condition}
                        </div>
                        <div className="text-xs text-gray-600 mt-1 italic">
                          "{req.reason}"
                        </div>
                      </div>
                    </div>

                    {apt ? (
                      <button
                        onClick={() => setActiveTab('appointments')}
                        className="text-xs bg-emerald-600 text-white font-bold px-3.5 py-2 rounded-xl shadow-sm hover:bg-emerald-700 whitespace-nowrap self-end sm:self-auto"
                      >
                        Xem lịch hẹn & Mã nhận
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Đang chờ xét & xếp lịch
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: MÓN ĐÃ ĐĂNG */}
      {activeTab === 'posted' && (
        <div className="space-y-4">
          {myPostedItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center space-y-2">
              <Package className="w-10 h-10 text-gray-300 mx-auto" />
              <div className="text-sm font-bold text-gray-700">Bạn chưa đăng món đồ nào để tặng</div>
              <p className="text-xs text-gray-500">
                Hãy chia sẻ sách vở, dụng cụ học tập bạn không còn dùng nữa để giúp đỡ bạn học khác nhé.
              </p>
              <button
                onClick={() => setActivePage('donate')}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl"
              >
                Đăng đồ ngay
              </button>
            </div>
          ) : (
            myPostedItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {item.id}
                    </span>
                    <span className="text-xs text-gray-500">Đăng ngày: {item.createdAt}</span>
                    {item.inputMethod === 'paper' && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                        Phiếu giấy
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.status === 'pending' && (
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Chờ duyệt thông tin
                      </span>
                    )}
                    {item.status === 'approved' && (
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt – Đang nhận yêu cầu
                      </span>
                    )}
                    {item.status === 'matching' && (
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full">
                        Đang xếp lịch điều phối
                      </span>
                    )}
                    {item.status === 'stored' && (
                      <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2.5 py-1 rounded-full">
                        Đang lưu tại kệ trạm {item.storageSlot}
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span className="text-xs bg-gray-100 text-gray-800 font-bold px-2.5 py-1 rounded-full">
                        Đã bàn giao hoàn tất
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="text-xs bg-red-100 text-red-800 font-bold px-2.5 py-1 rounded-full">
                        Bị từ chối
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-14 h-14 rounded-xl object-cover ring-1 ring-gray-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                      <div className="text-xs text-gray-500">
                        {CATEGORIES.find(c => c.id === item.category)?.name} • Tình trạng: {item.condition}
                      </div>
                      {item.rejectReason && (
                        <div className="text-xs text-red-600 mt-1">Lý do từ chối: {item.rejectReason}</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setActivePage('detail');
                    }}
                    className="text-xs bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-700 font-semibold px-3 py-2 rounded-xl transition-colors self-end sm:self-auto flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem chi tiết</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

