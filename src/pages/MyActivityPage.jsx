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
  Tag,
  Inbox,
  UserCheck,
  XCircle,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';

export default function MyActivityPage({ setActivePage, setSelectedItem }) {
  const {
    currentUser,
    items,
    requests,
    appointments,
    acceptRequestByDonor,
    rejectRequestByDonor
  } = useApp();

  const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' | 'appointments' | 'requests' | 'posted'
  const [expandedItemId, setExpandedItemId] = useState(null);

  // 1. Món do user hiện tại đăng
  const myPostedItems = items.filter(i => i.donorId === currentUser.id);
  const myPostedItemIds = myPostedItems.map(i => i.id);

  // 2. Yêu cầu do user hiện tại gửi đi để xin nhận đồ người khác
  const myOutgoingRequests = requests.filter(r => r.requesterId === currentUser.id);

  // 3. YÊU CẦU TỪ NGƯỜI KHÁC GỬI ĐẾN ĐỂ XIN NHẬN MÓN ĐỒ CỦA USER NÀY
  const incomingRequests = requests.filter(r => myPostedItemIds.includes(r.itemId));
  const pendingIncomingCount = incomingRequests.filter(r => r.status === 'pending').length;

  // 4. Lịch hẹn liên quan đến user (là người cho hoặc người nhận)
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

      {/* 4 TABS CHÍNH */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-sm gap-1.5">
        {/* TAB 1: YÊU CẦU GỬI ĐẾN TÔI (INCOMING REQUESTS) */}
        <button
          onClick={() => setActiveTab('incoming')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'incoming'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Yêu cầu gửi đến tôi</span>
          {pendingIncomingCount > 0 ? (
            <span className="text-xs px-2 py-0.2 rounded-full font-bold bg-amber-500 text-amber-950 animate-pulse">
              {pendingIncomingCount}
            </span>
          ) : (
            <span className={`text-xs px-2 py-0.2 rounded-full font-bold ${activeTab === 'incoming' ? 'bg-white text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
              {incomingRequests.length}
            </span>
          )}
        </button>

        {/* TAB 2: LỊCH HẸN SẮP TỚI */}
        <button
          onClick={() => setActiveTab('appointments')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
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

        {/* TAB 3: YÊU CẦU TÔI ĐÃ GỬI */}
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'requests'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Yêu cầu tôi đã gửi</span>
          <span className={`text-xs px-2 py-0.2 rounded-full font-bold ${activeTab === 'requests' ? 'bg-white text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
            {myOutgoingRequests.length}
          </span>
        </button>

        {/* TAB 4: MÓN TÔI ĐÃ ĐĂNG */}
        <button
          onClick={() => setActiveTab('posted')}
          className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'posted'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Món tôi đã đăng</span>
          <span className={`text-xs px-2 py-0.2 rounded-full font-bold ${activeTab === 'posted' ? 'bg-white text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
            {myPostedItems.length}
          </span>
        </button>
      </div>

      {/* ========================================================== */}
      {/* TAB 1: YÊU CẦU GỬI ĐẾN TÔI (INCOMING REQUESTS) */}
      {/* ========================================================== */}
      {activeTab === 'incoming' && (
        <div className="space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-950">
            <div>
              <strong>Hộp thư yêu cầu nhận đồ dùng của bạn:</strong> Dưới đây là danh sách các bạn học sinh đang gửi lời xin nhận những món đồ bạn đã đăng.
            </div>
            <span className="bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg shrink-0">
              {incomingRequests.length} yêu cầu
            </span>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-2">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto" />
              <div className="text-sm font-bold text-gray-700">Chưa có bạn nào gửi yêu cầu nhận món đồ của bạn</div>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Khi có bạn học sinh bấm "Gửi yêu cầu nhận" cho các món đồ bạn đăng tặng, thông tin và lý do của các bạn ấy sẽ xuất hiện ngay tại đây!
              </p>
            </div>
          ) : (
            incomingRequests.map(req => {
              const item = items.find(i => i.id === req.itemId);
              const isSelected = req.status === 'selected';
              const isPending = req.status === 'pending';
              const isRejected = req.status === 'rejected';

              return (
                <div
                  key={req.id}
                  className={`bg-white border-2 rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
                    isSelected
                      ? 'border-emerald-400 bg-emerald-50/20'
                      : isRejected
                      ? 'border-gray-200 opacity-60'
                      : 'border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  {/* Top info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {req.id}
                      </span>
                      <span className="text-xs text-gray-500">Gửi lúc: {req.createdAt}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                        {req.inputMethod === 'website' ? 'Qua Web' : 'Phiếu giấy'}
                      </span>
                    </div>

                    <div>
                      {isPending && (
                        <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Đang chờ bạn phản hồi
                        </span>
                      )}
                      {isSelected && (
                        <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Bạn đã đồng ý trao cho bạn này
                        </span>
                      )}
                      {req.status === 'backup' && (
                        <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full">
                          Danh sách dự phòng
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2.5 py-1 rounded-full">
                          Đã từ chối
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Requester & Item info */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    {/* Item being requested */}
                    <div className="md:col-span-5 flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <img
                        src={item?.image}
                        alt={item?.title}
                        className="w-14 h-14 rounded-lg object-cover ring-1 ring-gray-200 shrink-0"
                      />
                      <div className="text-xs">
                        <span className="text-[10px] text-emerald-700 font-bold uppercase">Món đồ của bạn:</span>
                        <h4 className="font-bold text-gray-900 line-clamp-1">{item?.title || req.itemId}</h4>
                        <div className="text-gray-500 text-[11px]">Mã món: {item?.id} • {item?.condition}</div>
                      </div>
                    </div>

                    {/* Requester student info & reason */}
                    <div className="md:col-span-7 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">{req.requesterName}</span>
                        <span className="text-gray-600 bg-white border border-gray-200 px-2 py-0.2 rounded font-medium">
                          Lớp: {req.requesterClass} ({req.requesterId})
                        </span>
                      </div>

                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-amber-950 italic">
                        "{req.reason}"
                      </div>

                      {/* Requester slots */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                        <span className="text-gray-500 font-medium">Khung giờ bạn ấy có thể nhận:</span>
                        {req.availableSlots?.map(slotId => {
                          const s = STATION_SLOTS.find(sl => sl.id === slotId);
                          return (
                            <span key={slotId} className="bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                              {s?.label || slotId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Donor */}
                  {isPending && (
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const reason = prompt('Nhập lý do từ chối (nếu có):') || 'Người cho đã chọn ứng viên khác';
                          rejectRequestByDonor(req.id, reason);
                        }}
                        className="text-xs px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-semibold"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => acceptRequestByDonor(req.id)}
                        className="text-xs px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Đồng ý trao cho bạn này</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: LỊCH HẸN SẮP TỚI */}
      {/* ========================================================== */}
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

      {/* ========================================================== */}
      {/* TAB 3: YÊU CẦU TÔI ĐÃ GỬI (OUTGOING REQUESTS) */}
      {/* ========================================================== */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {myOutgoingRequests.length === 0 ? (
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
            myOutgoingRequests.map(req => {
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

      {/* ========================================================== */}
      {/* TAB 4: MÓN TÔI ĐÃ ĐĂNG (KÈM DANH SÁCH YÊU CẦU CHO TỪNG MÓN) */}
      {/* ========================================================== */}
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
            myPostedItems.map(item => {
              const itemReqs = requests.filter(r => r.itemId === item.id);
              const isExpanded = expandedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4"
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

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                          itemReqs.length > 0
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{itemReqs.length} bạn xin nhận</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setActivePage('detail');
                        }}
                        className="text-xs bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-700 font-semibold px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem chi tiết</span>
                      </button>
                    </div>
                  </div>

                  {/* EXPANDABLE LIST OF REQUESTS FOR THIS SPECIFIC ITEM */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/80 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-3">
                      <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
                        <span>Danh sách các bạn học sinh xin nhận món này ({itemReqs.length}):</span>
                        <span className="text-[11px] font-normal text-gray-500">Bạn có thể chọn trực tiếp bạn mình muốn trao tặng</span>
                      </div>

                      {itemReqs.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">Chưa có bạn nào gửi yêu cầu nhận món này.</p>
                      ) : (
                        <div className="space-y-2">
                          {itemReqs.map(req => (
                            <div
                              key={req.id}
                              className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900">{req.requesterName}</span>
                                  <span className="text-gray-500 font-mono">({req.requesterClass} - {req.requesterId})</span>
                                  {req.status === 'selected' && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded">
                                      Đã chọn
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 italic">"{req.reason}"</p>
                              </div>

                              {req.status === 'pending' && (
                                <button
                                  onClick={() => acceptRequestByDonor(req.id)}
                                  className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Đồng ý trao cho bạn này</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
