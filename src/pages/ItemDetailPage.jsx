import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, STATION_SLOTS } from '../data/seedData';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  HelpCircle,
  Info,
  Send,
  ShieldCheck,
  Tag,
  User,
  XCircle,
  Warehouse
} from 'lucide-react';

export default function ItemDetailPage({ item, setActivePage }) {
  const { currentUser, addRequest, requests } = useApp();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [inputMethod, setInputMethod] = useState('website');

  if (!item) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-gray-700">Không tìm thấy món đồ</h2>
        <button
          onClick={() => setActivePage('catalog')}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
        >
          Quay lại kho đồ
        </button>
      </div>
    );
  }

  const categoryInfo = CATEGORIES.find(c => c.id === item.category);

  // Kiểm tra điều kiện có được gửi yêu cầu nhận không
  const isDonor = currentUser.id === item.donorId;
  const isClosed = item.requestStatus === 'closed';
  const isCompleted = item.status === 'completed';
  const isRejected = item.status === 'rejected';

  // Kiểm tra xem user hiện tại đã gửi request cho món này chưa
  const existingUserRequest = requests.find(r => r.itemId === item.id && r.requesterId === currentUser.id);

  const canRequest = !isDonor && !isClosed && !isCompleted && !isRejected && !existingUserRequest;

  let disabledReason = '';
  if (isDonor) {
    disabledReason = 'Bạn là người đăng món đồ này nên không thể gửi yêu cầu nhận lại chính đồ của mình.';
  } else if (existingUserRequest) {
    disabledReason = `Bạn đã gửi yêu cầu nhận món này vào ${existingUserRequest.createdAt} (Mã yêu cầu: ${existingUserRequest.id} - Trạng thái: ${existingUserRequest.status === 'pending' ? 'Đang chờ xét' : existingUserRequest.status === 'selected' ? 'Đã được chọn' : 'Dự phòng'}).`;
  } else if (isCompleted) {
    disabledReason = 'Món đồ này đã được bàn giao hoàn tất cho người nhận khác.';
  } else if (isClosed) {
    disabledReason = 'Món đồ này đã tạm đóng đợt đăng ký để giáo viên và đội trực tiến hành xét chọn & xếp lịch.';
  } else if (isRejected) {
    disabledReason = 'Món đồ không đạt tiêu chuẩn phê duyệt.';
  }

  const handleToggleSlot = (slotId) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const handleSelectAllSlots = () => {
    if (selectedSlots.length === STATION_SLOTS.length) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots(STATION_SLOTS.map(s => s.id));
    }
  };

  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do/nhu cầu nhận đồ của bạn!');
      return;
    }
    if (selectedSlots.length === 0) {
      alert('Vui lòng chọn ít nhất 1 khung giờ có thể đến nhận đồ tại trạm Lê Lợi!');
      return;
    }

    addRequest(item.id, reason, selectedSlots, inputMethod);
    setShowRequestModal(false);
    setActivePage('my-activity');
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => setActivePage('catalog')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại danh sách kho đồ</span>
      </button>

      {/* Main Detail Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Left: Big Image & Tags */}
        <div className="md:col-span-5 bg-gray-100 relative min-h-[320px] md:min-h-full">
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              {item.condition}
            </span>
            {item.storageSlot && (
              <span className="bg-teal-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5" /> Kệ trạm {item.storageSlot}
              </span>
            )}
          </div>
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md text-white font-mono text-xs px-2.5 py-1 rounded-lg">
            Mã: {item.id}
          </div>
        </div>

        {/* Right: Detailed Info */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                {categoryInfo?.name}
              </span>
              <span className="text-xs text-gray-400">
                Đăng ngày: {item.createdAt}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
              {item.title}
            </h1>

            <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold uppercase text-gray-400 mb-1">Mô tả tình trạng món đồ:</h4>
              <p className="whitespace-pre-line">{item.description}</p>
            </div>

            {/* Quality Check badge if available */}
            {item.qualityCheck && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-emerald-900">
                    Đã kiểm tra chất lượng thực tế tại Trạm: {item.qualityCheck.passed ? 'ĐẠT LOẠI A' : 'KHÔNG ĐẠT'}
                  </div>
                  <div className="text-emerald-700 mt-0.5">
                    Ghi chú: {item.qualityCheck.note} (Kiểm tra bởi {item.qualityCheck.checkedBy})
                  </div>
                </div>
              </div>
            )}

            {/* Donor info & Available delivery slots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <span className="text-gray-400 block font-medium">Người tặng:</span>
                <span className="font-bold text-gray-800 text-sm">{item.donorName || item.donorId}</span>
                <span className="text-gray-500 block text-[11px] mt-0.5">Hình thức nhập: {item.inputMethod === 'website' ? 'Website' : 'Phiếu giấy tại trạm'}</span>
              </div>
              <div className="p-3 rounded-xl border border-gray-200 bg-white">
                <span className="text-gray-400 block font-medium">Trạng thái đợt nhận:</span>
                <span className={`font-bold text-sm ${item.requestStatus === 'open' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {item.requestStatus === 'open' ? 'Đang mở nhận yêu cầu' : 'Tạm đóng xét chọn'}
                </span>
                <span className="text-gray-500 block text-[11px] mt-0.5">Thời hạn lưu trạm: Tối đa 3 ngày học</span>
              </div>
            </div>

            {/* Donor slots */}
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Các khung giờ người cho có thể gửi đồ tại Trạm:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.availableSlots?.map(slotId => {
                  const s = STATION_SLOTS.find(sl => sl.id === slotId);
                  return (
                    <span
                      key={slotId}
                      className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium"
                    >
                      {s?.label || slotId}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            {canRequest ? (
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              >
                <Heart className="w-5 h-5 text-emerald-200" />
                <span>Gửi yêu cầu nhận món đồ này</span>
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full bg-gray-200 text-gray-400 font-bold py-3 px-6 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Không thể gửi yêu cầu nhận</span>
                </button>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>{disabledReason}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL GỬI YÊU CẦU NHẬN (TRANG 5) */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Bước đăng ký nhận đồ dùng
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-1">
                  Gửi yêu cầu nhận: {item.title}
                </h3>
              </div>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              {/* Thông tin người nhận */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500"
                />
                <div className="text-xs">
                  <div className="font-bold text-gray-800">
                    {currentUser.name} ({currentUser.id})
                  </div>
                  <div className="text-gray-500">
                    Lớp: {currentUser.class} • Buổi học: {currentUser.shift}
                  </div>
                </div>
              </div>

              {/* Lý do / Nhu cầu */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nhu cầu / Lý do bạn cần món đồ này <span className="text-red-500">*</span>:
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ví dụ: Em muốn nhận sách để ôn thi học kỳ / Cặp của em bị hỏng khóa..."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Chọn ca trực rảnh để nhận */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    Chọn các khung giờ bạn có thể đến Trạm nhận đồ <span className="text-red-500">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllSlots}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    {selectedSlots.length === STATION_SLOTS.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-200 rounded-xl bg-gray-50">
                  {STATION_SLOTS.map(slot => {
                    const isChecked = selectedSlots.includes(slot.id);
                    return (
                      <label
                        key={slot.id}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                          isChecked
                            ? 'bg-emerald-100/80 border-emerald-400 font-semibold text-emerald-900'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSlot(slot.id)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{slot.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Hình thức */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Hình thức đăng ký:
                </label>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="inputMethod"
                      value="website"
                      checked={inputMethod === 'website'}
                      onChange={() => setInputMethod('website')}
                    />
                    <span>Trực tuyến (Website)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="inputMethod"
                      value="paper"
                      checked={inputMethod === 'paper'}
                      onChange={() => setInputMethod('paper')}
                    />
                    <span>Phiếu giấy tại trạm</span>
                  </label>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                <strong>Lưu ý KHKT:</strong> Sau khi gửi yêu cầu, hệ thống sẽ lưu ở trạng thái <em>"Chờ xét"</em>. Nếu có từ 2 học sinh cùng đăng ký, giáo viên & đội trực sẽ tiến hành bốc thăm công bằng và xếp lịch qua thuật toán LoopMatch.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Xác nhận gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

