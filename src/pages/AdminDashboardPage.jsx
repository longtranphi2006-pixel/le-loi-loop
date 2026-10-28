import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, STATION_SLOTS, STORAGE_SLOTS } from '../data/seedData';
import { runLoopMatchAlgorithm } from '../utils/loopMatchAlgorithm';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Dice5,
  Calendar,
  Warehouse,
  ShieldCheck,
  QrCode,
  FileText,
  Search,
  Check,
  RotateCcw,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboardPage({ setActivePage, setSelectedItem }) {
  const {
    currentUser,
    items,
    requests,
    appointments,
    logs,
    occupiedSlotCount,
    maxCapacity,
    approveItem,
    rejectItem,
    requestItemUpdate,
    closeItemRegistration,
    conductLottery,
    selectRecipientManually,
    confirmAppointment,
    rescheduleAppointment,
    cancelAppointment,
    inspectAndReceiveItem,
    completeHandover
  } = useApp();

  const [adminTab, setAdminTab] = useState('tabA'); // 'tabA' | 'tabB' | 'tabC' | 'tabD' | 'tabE' | 'tabF'

  // State cho Tab A: Từ chối / Bổ sung modal
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReasonText, setRejectReasonText] = useState('');
  const [updateModalItem, setUpdateModalItem] = useState(null);
  const [updateNoteText, setUpdateNoteText] = useState('');

  // State cho Tab B: Seed bốc thăm
  const [lotterySeeds, setLotterySeeds] = useState({});

  // State cho Tab D: Kiểm tra thực tế
  const [inspectionState, setInspectionState] = useState({});

  // State cho Tab E: Bàn giao đồ
  const [handoverCode, setHandoverCode] = useState('');
  const [handoverResult, setHandoverResult] = useState(null);

  // Lọc items cho các tab
  const pendingItems = items.filter(i => i.status === 'pending');
  const itemsNeedingLottery = items.filter(i => {
    const itemReqs = requests.filter(r => r.itemId === i.id);
    return itemReqs.length > 0 && i.status !== 'completed' && i.status !== 'rejected';
  });

  // Tab C: Các món đã có người nhận nhưng chưa có appointment
  const itemsNeedingAppointment = items.filter(i => {
    const hasApt = appointments.some(a => a.itemId === i.id && a.status !== 'cancelled');
    const hasWinner = requests.some(r => r.itemId === i.id && r.status === 'selected');
    return hasWinner && !hasApt && i.status !== 'completed';
  });

  // Tab D: Các appointments đang chờ gửi đồ / kiểm tra tại trạm
  const appointmentsToInspect = appointments.filter(
    a => a.status === 'scheduled' || a.status === 'donor_arrived'
  );

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Header Admin */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            Hệ thống Quản lý & Điều phối THCS Lê Lợi
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bảng điều khiển Nghiệp vụ KHKT
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
            Khu vực làm việc chuyên trách của Giáo viên phụ trách KHKT (GV01) và Đội trực trạm CLB Tình nguyện (TR01).
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl text-xs space-y-1 shrink-0">
          <div>Người đăng nhập: <strong>{currentUser.name}</strong></div>
          <div>Mã: <strong className="font-mono">{currentUser.id}</strong> ({currentUser.role})</div>
          <div className="text-amber-300 font-semibold">Sức chứa trạm K1: {occupiedSlotCount}/{maxCapacity} ô</div>
        </div>
      </div>

      {/* 6 TABS NAVIGATION */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm text-xs font-bold">
        <button
          onClick={() => setAdminTab('tabA')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 relative ${
            adminTab === 'tabA'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>A. Duyệt bài đăng</span>
          {pendingItems.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${adminTab === 'tabA' ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              {pendingItems.length} chờ
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('tabB')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
            adminTab === 'tabB'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>B. Xét chọn người nhận</span>
          <span className="text-[10px] opacity-70">Bốc thăm Fixed Seed</span>
        </button>

        <button
          onClick={() => setAdminTab('tabC')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
            adminTab === 'tabC'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>C. Xếp lịch trao nhận</span>
          {itemsNeedingAppointment.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${adminTab === 'tabC' ? 'bg-white text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
              {itemsNeedingAppointment.length} cần lịch
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('tabD')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
            adminTab === 'tabD'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>D. Tiếp nhận & Kiểm tra</span>
          <span className="text-[10px] opacity-70">Gán ô kệ K1</span>
        </button>

        <button
          onClick={() => setAdminTab('tabE')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
            adminTab === 'tabE'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>E. Bàn giao đồ</span>
          <span className="text-[10px] opacity-70">Đối chiếu mã nhận</span>
        </button>

        <button
          onClick={() => setAdminTab('tabF')}
          className={`p-2.5 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${
            adminTab === 'tabF'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span>F. Nhật ký hệ thống</span>
          <span className="text-[10px] opacity-70">{logs.length} bản ghi</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB A: DUYỆT BÀI ĐĂNG (Duyệt / Từ chối / Bổ sung) */}
      {/* ======================================================== */}
      {adminTab === 'tabA' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Tab A: Hàng đợi Phê duyệt bài đăng đồ dùng mới
              </h2>
              <p className="text-xs text-gray-500">
                Kiểm tra thông tin sách vở, đồ dùng có phù hợp với lứa tuổi THCS trước khi công khai lên Kho đồ
              </p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              {pendingItems.length} món đang chờ duyệt
            </span>
          </div>

          {pendingItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-gray-700 text-sm">Tuyệt vời! Không còn bài đăng nào chờ duyệt</div>
              <p>Mọi món đồ học sinh đăng lên đều đã được xử lý đầy đủ.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map(item => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-20 h-20 rounded-xl object-cover ring-1 ring-amber-300 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{item.title}</span>
                        <span className="font-mono text-xs bg-black/70 text-white px-2 py-0.2 rounded">
                          {item.id}
                        </span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded">
                          {item.inputMethod === 'website' ? 'Web Online' : 'Phiếu giấy'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Danh mục: <strong>{CATEGORIES.find(c => c.id === item.category)?.name}</strong> • Tình trạng: <strong>{item.condition}</strong>
                      </div>
                      <div className="text-xs text-gray-500">
                        Người gửi: <strong>{item.donorName}</strong> ({item.donorId}) • Đăng: {item.createdAt}
                      </div>
                      <p className="text-xs text-gray-700 italic bg-white p-2 rounded-lg border border-amber-200 mt-1">
                        "{item.description}"
                      </p>
                    </div>
                  </div>

                  {/* Hành động duyệt */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => approveItem(item.id)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Phê duyệt</span>
                    </button>
                    <button
                      onClick={() => {
                        setUpdateModalItem(item);
                        setUpdateNoteText('');
                      }}
                      className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3 py-2.5 rounded-xl"
                    >
                      <span>Yêu cầu bổ sung</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalItem(item);
                        setRejectReasonText('');
                      }}
                      className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold px-3 py-2.5 rounded-xl"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Từ chối</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal Từ chối */}
          {rejectModalItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-gray-900 text-base">Từ chối bài đăng {rejectModalItem.id}</h3>
                <p className="text-xs text-gray-500">Nhập lý do từ chối để học sinh nắm rõ (ví dụ: Sách rách nhiều trang, không thuộc chương trình hiện hành...):</p>
                <textarea
                  rows={3}
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  placeholder="Lý do từ chối..."
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setRejectModalItem(null)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      if (!rejectReasonText.trim()) return alert('Vui lòng nhập lý do!');
                      rejectItem(rejectModalItem.id, rejectReasonText);
                      setRejectModalItem(null);
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Bổ sung */}
          {updateModalItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-gray-900 text-base">Yêu cầu bổ sung thông tin {updateModalItem.id}</h3>
                <textarea
                  rows={3}
                  value={updateNoteText}
                  onChange={(e) => setUpdateNoteText(e.target.value)}
                  placeholder="Ghi chú nội dung cần bổ sung (Ví dụ: Chụp thêm ảnh gáy sách, ghi rõ bộ Kết nối hay Chân trời...)"
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setUpdateModalItem(null)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      if (!updateNoteText.trim()) return alert('Vui lòng nhập ghi chú!');
                      requestItemUpdate(updateModalItem.id, updateNoteText);
                      setUpdateModalItem(null);
                    }}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700"
                  >
                    Gửi yêu cầu bổ sung
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB B: XÉT CHỌN NGƯỜI NHẬN & BỐC THĂM (Fixed Seed) */}
      {/* ======================================================== */}
      {adminTab === 'tabB' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Tab B: Xét chọn người nhận & Bốc thăm minh bạch
            </h2>
            <p className="text-xs text-gray-500">
              Khi một món đồ có từ 2 học sinh cùng đăng ký, hệ thống sử dụng thuật toán bốc thăm ngẫu nhiên hỗ trợ Seed cố định (Fixed Seed) để đảm bảo tính khách quan và có thể kiểm chứng lại trong báo cáo KHKT.
            </p>
          </div>

          <div className="space-y-6">
            {itemsNeedingLottery.map(item => {
              const itemReqs = requests.filter(r => r.itemId === item.id);
              const seedVal = lotterySeeds[item.id] || `SEED-KHKT-${item.id}-2026`;
              const winner = itemReqs.find(r => r.status === 'selected');

              return (
                <div key={item.id} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.title} className="w-14 h-14 rounded-xl object-cover ring-1 ring-gray-200 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-gray-900">{item.title}</h4>
                          <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded font-bold">{item.id}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Người tặng: <strong>{item.donorName}</strong> • Tổng số yêu cầu: <strong className="text-emerald-700">{itemReqs.length} học sinh</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.requestStatus === 'open' ? (
                        <button
                          onClick={() => closeItemRegistration(item.id)}
                          className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-3 py-2 rounded-xl"
                        >
                          Đóng đợt nhận yêu cầu
                        </button>
                      ) : (
                        <span className="text-xs bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl">
                          Đã đóng đợt đăng ký
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Danh sách các ứng viên đăng ký nhận */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-gray-700">Danh sách học sinh gửi yêu cầu ({itemReqs.length}):</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {itemReqs.map(req => (
                        <div
                          key={req.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            req.status === 'selected'
                              ? 'bg-emerald-100 border-emerald-400 font-bold text-emerald-950 shadow-sm'
                              : req.status === 'backup'
                              ? 'bg-blue-50 border-blue-200 text-blue-900'
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span>{req.requesterName} (Lớp {req.requesterClass} - {req.requesterId})</span>
                              {req.lotteryRank && (
                                <span className="bg-emerald-700 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                                  Hạng #{req.lotteryRank}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] opacity-80 mt-0.5 line-clamp-1 italic">"{req.reason}"</div>
                          </div>

                          <div className="flex items-center gap-1">
                            {req.status === 'selected' ? (
                              <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Chính thức
                              </span>
                            ) : (
                              <button
                                onClick={() => selectRecipientManually(req.id)}
                                className="text-[10px] bg-white border border-gray-300 hover:bg-emerald-50 hover:border-emerald-500 px-2 py-1 rounded text-gray-700 font-semibold"
                                title="Giáo viên ưu tiên chọn trường hợp này"
                              >
                                Ưu tiên chọn
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seed input & Bốc thăm button */}
                  {itemReqs.length >= 2 && (
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="font-bold text-gray-700 whitespace-nowrap">Mã Fixed Seed:</span>
                        <input
                          type="text"
                          value={seedVal}
                          onChange={(e) => setLotterySeeds({ ...lotterySeeds, [item.id]: e.target.value })}
                          className="p-1.5 border border-gray-200 rounded-lg text-xs font-mono font-semibold w-full sm:w-48 bg-gray-50"
                        />
                      </div>
                      <button
                        onClick={() => conductLottery(item.id, seedVal)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold px-4 py-2 rounded-xl shadow-md"
                      >
                        <Dice5 className="w-4 h-4" />
                        <span>Bốc thăm ngẫu nhiên (1 chính thức + dự phòng)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB C: ĐIỀU PHỐI LỊCH TRAO NHẬN (LoopMatch Integration) */}
      {/* ======================================================== */}
      {adminTab === 'tabC' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Tab C: Điều phối & Chốt lịch trao nhận bằng LoopMatch
            </h2>
            <p className="text-xs text-gray-500">
              Hệ thống tự động chạy thuật toán đối chiếu ca rảnh của Người cho và Người nhận, kiểm tra sức chứa kệ K1 và đề xuất phương án tối ưu nhất.
            </p>
          </div>

          {itemsNeedingAppointment.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-gray-700 text-sm">Hiện không có món nào chờ xếp lịch hẹn</div>
              <p>Tất cả các món đã có người nhận chính thức đều đã được chốt lịch.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {itemsNeedingAppointment.map(item => {
                const winnerReq = requests.find(r => r.itemId === item.id && r.status === 'selected');
                if (!winnerReq) return null;

                // Chạy thuật toán LoopMatch cho cặp này
                const matchResult = runLoopMatchAlgorithm({
                  donorSlots: item.availableSlots || [],
                  requesterSlots: winnerReq.availableSlots || [],
                  currentOccupiedCount: occupiedSlotCount,
                  maxCapacity: maxCapacity,
                  maxDays: 3
                });

                return (
                  <div key={item.id} className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/20 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-gray-900">{item.title}</h3>
                          <span className="font-mono text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">{item.id}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          Người cho: <strong>{item.donorName}</strong> ➔ Người nhận trúng tuyển: <strong>{winnerReq.requesterName} ({winnerReq.requesterId})</strong>
                        </div>
                      </div>

                      <div className="text-xs text-blue-900 font-mono bg-blue-100 px-2.5 py-1 rounded-lg">
                        Thời gian giải thuật: <strong>{matchResult.executionTimeMs} ms</strong>
                      </div>
                    </div>

                    {/* Hiển thị đề xuất LoopMatch */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-gray-700">Đề xuất lịch hẹn từ thuật toán LoopMatch:</div>

                      {matchResult.bestOption ? (
                        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold uppercase text-emerald-900 bg-emerald-200/80 px-2.5 py-0.5 rounded">
                              ⭐ Phương án 1 (Tối ưu nhất) – {matchResult.bestOption.typeName}
                            </span>
                            <span className="text-xs font-bold text-emerald-800">
                              Điểm số: {matchResult.bestOption.score}
                            </span>
                          </div>

                          <p className="text-xs text-emerald-950 font-medium">
                            {matchResult.bestOption.description}
                          </p>

                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                              Ca người cho: <strong>{matchResult.bestOption.donorSlotInfo?.label}</strong>
                            </span>
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                              Ca người nhận: <strong>{matchResult.bestOption.requesterSlotInfo?.label}</strong>
                            </span>
                            <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300">
                              Chiếm ô kệ: <strong>{matchResult.bestOption.shelfUsage} ô</strong>
                            </span>
                          </div>

                          <button
                            onClick={() => confirmAppointment({
                              itemId: item.id,
                              requestId: winnerReq.id,
                              donorId: item.donorId,
                              requesterId: winnerReq.requesterId,
                              type: matchResult.bestOption.type,
                              donorSlot: matchResult.bestOption.donorSlot,
                              requesterSlot: matchResult.bestOption.requesterSlot,
                              notes: `Chốt theo đề xuất tối ưu LoopMatch (Score: ${matchResult.bestOption.score})`
                            })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            <span>Duyệt chốt lịch này & Sinh mã nhận</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                          <strong>Không tìm thấy phương án hợp lệ:</strong> Các ca rảnh của 2 bạn lệch nhau hoặc vi phạm giới hạn lưu trữ tối đa 3 ngày học. Hãy liên hệ hỗ trợ đổi ca.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Danh sách các lịch hẹn đã chốt */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h3 className="font-bold text-sm text-gray-900">Danh sách các lịch hẹn đang hiệu lực:</h3>
            <div className="divide-y divide-gray-100">
              {appointments.filter(a => a.status !== 'cancelled').map(apt => (
                <div key={apt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{apt.id}</span>
                      <span className="font-bold text-emerald-700">Mã nhận: {apt.pickupCode}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                        {apt.type === 'direct' ? 'Trực tiếp' : 'Lưu tạm'}
                      </span>
                    </div>
                    <div className="text-gray-500 mt-0.5">
                      Món: {apt.itemId} • Cho: {apt.donorId} ({apt.donorSlot}) ➔ Nhận: {apt.requesterId} ({apt.requesterSlot})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const reason = prompt('Nhập lý do hủy lịch hẹn:');
                        if (reason) cancelAppointment(apt.id, reason);
                      }}
                      className="text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-semibold"
                    >
                      Hủy lịch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB D: TIẾP NHẬN & KIỂM TRA THỰC TẾ TẠI TRẠM (Gán ô kệ K1) */}
      {/* ======================================================== */}
      {adminTab === 'tabD' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Tab D: Tiếp nhận & Kiểm tra chất lượng thực tế tại Trạm
            </h2>
            <p className="text-xs text-gray-500">
              Khi học sinh mang hiện vật đến trạm, Tình nguyện viên & Thầy phụ trách kiểm tra đối chiếu thực tế. Nếu đạt, gán vào 1 ô kệ lưu trữ K1 (nếu là lưu tạm) để chờ người nhận tới lấy.
            </p>
          </div>

          {appointmentsToInspect.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-500 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <div className="font-bold text-gray-700 text-sm">Hiện không có lịch hẹn nào đang chờ mang đồ đến trạm</div>
            </div>
          ) : (
            <div className="space-y-6">
              {appointmentsToInspect.map(apt => {
                const item = items.find(i => i.id === apt.itemId);
                const currentIns = inspectionState[apt.id] || {
                  note: 'Sách vở còn nguyên bìa, đầy đủ trang, sạch sẽ',
                  slot: 'K1-A2',
                  passed: true
                };

                return (
                  <div key={apt.id} className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/20 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-gray-900">{apt.id}</span>
                          <span className="font-bold text-gray-700">{item?.title}</span>
                          <span className="font-mono text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                            {apt.itemId}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          Người mang đến: <strong>{apt.donorId}</strong> ({apt.donorSlot}) ➔ Người nhận: <strong>{apt.requesterId}</strong> ({apt.requesterSlot})
                        </div>
                      </div>

                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg">
                        Hình thức: {apt.type === 'direct' ? 'Trao trực tiếp' : 'Cần lưu tạm ô kệ'}
                      </span>
                    </div>

                    {/* Form kiểm tra */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                      <div className="md:col-span-6 space-y-1.5">
                        <label className="font-bold text-gray-700">Ghi chú kiểm tra thực tế:</label>
                        <input
                          type="text"
                          value={currentIns.note}
                          onChange={(e) => setInspectionState({
                            ...inspectionState,
                            [apt.id]: { ...currentIns, note: e.target.value }
                          })}
                          className="w-full p-2.5 border border-gray-200 rounded-xl bg-white"
                          placeholder="Ghi chú đánh giá chất lượng..."
                        />
                      </div>

                      {apt.type === 'temporary_storage' && (
                        <div className="md:col-span-3 space-y-1.5">
                          <label className="font-bold text-gray-700">Gán ô kệ K1 lưu giữ:</label>
                          <select
                            value={currentIns.slot}
                            onChange={(e) => setInspectionState({
                              ...inspectionState,
                              [apt.id]: { ...currentIns, slot: e.target.value }
                            })}
                            className="w-full p-2.5 border border-gray-200 rounded-xl bg-white font-mono font-bold text-emerald-800"
                          >
                            {STORAGE_SLOTS.map(sl => (
                              <option key={sl} value={sl}>Ô {sl}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="md:col-span-3 flex items-end gap-2">
                        <button
                          onClick={() => inspectAndReceiveItem({
                            aptId: apt.id,
                            passed: true,
                            note: currentIns.note,
                            storageSlot: currentIns.slot
                          })}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl shadow-md flex items-center justify-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          <span>Đạt kiểm tra</span>
                        </button>
                        <button
                          onClick={() => inspectAndReceiveItem({
                            aptId: apt.id,
                            passed: false,
                            note: currentIns.note || 'Không đạt quy chuẩn chất lượng',
                            storageSlot: null
                          })}
                          className="bg-red-100 hover:bg-red-200 text-red-800 font-bold py-2.5 px-3 rounded-xl"
                        >
                          Không đạt
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB E: BÀN GIAO ĐỒ (Nhập mã nhận & Vô hiệu hóa) */}
      {/* ======================================================== */}
      {adminTab === 'tabE' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Tab E: Bàn giao đồ dùng & Vô hiệu hóa mã nhận
            </h2>
            <p className="text-xs text-gray-500">
              Học sinh mang mã nhận đồ (Ví dụ LOOP-7821) đến Trạm. Tình nguyện viên nhập mã để đối chiếu. Sau khi bàn giao thành công, mã nhận sẽ bị vô hiệu hóa vĩnh viễn và ô kệ K1 sẽ được giải phóng.
            </p>
          </div>

          <div className="max-w-xl mx-auto space-y-4 bg-gray-50 p-6 rounded-3xl border border-gray-200">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700">
                Nhập mã nhận đồ học sinh cung cấp (hoặc quét QR):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={handoverCode}
                  onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: LOOP-7821"
                  className="flex-1 p-3 text-base font-mono font-bold tracking-wider uppercase border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
                <button
                  onClick={() => {
                    if (!handoverCode.trim()) return alert('Vui lòng nhập mã nhận đồ!');
                    const res = completeHandover(handoverCode);
                    setHandoverResult(res);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md text-xs"
                >
                  Xác thực & Bàn giao
                </button>
              </div>
            </div>

            {/* Kết quả bàn giao */}
            {handoverResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                handoverResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {handoverResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>{handoverResult.message}</span>
                </div>

                {handoverResult.success && (
                  <div className="space-y-1 text-xs pt-1 border-t border-emerald-200">
                    <div>Món đồ: <strong>{handoverResult.item?.title}</strong> ({handoverResult.item?.id})</div>
                    <div>Người nhận: <strong>{handoverResult.appointment?.requesterId}</strong></div>
                    <div className="text-emerald-800 font-semibold">
                      ✓ Mã nhận {handoverResult.appointment?.pickupCode} đã bị vô hiệu hóa an toàn!
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Helper: Danh sách mã đang sẵn sàng nhận */}
            <div className="pt-2">
              <div className="text-[11px] font-bold text-gray-500 mb-1">Mã nhận đang hợp lệ sẵn sàng để test bàn giao:</div>
              <div className="flex flex-wrap gap-1.5">
                {appointments.filter(a => a.status === 'ready_for_pickup' || a.status === 'scheduled').map(a => (
                  <button
                    key={a.id}
                    onClick={() => setHandoverCode(a.pickupCode)}
                    className="font-mono text-xs bg-white border border-gray-300 px-2.5 py-1 rounded-lg text-emerald-800 font-bold hover:bg-emerald-50"
                  >
                    {a.pickupCode} ({a.itemId})
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB F: NHẬT KÝ HỆ THỐNG (AUDIT LOGS) */}
      {/* ======================================================== */}
      {adminTab === 'tabF' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Tab F: Nhật ký kiểm toán hệ thống (Audit Logs)
            </h2>
            <p className="text-xs text-gray-500">
              Lưu vết toàn bộ dòng chảy dữ liệu: Đăng món, duyệt bài, bốc thăm, xếp lịch, tiếp nhận tại trạm và bàn giao hoàn tất.
            </p>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {logs.map(log => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-100/80 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.2 rounded">
                      {log.action}
                    </span>
                    <span className="text-gray-500">{log.timestamp}</span>
                  </div>
                  <div className="text-gray-800 font-medium">{log.details}</div>
                </div>

                <div className="text-[11px] text-gray-400 font-semibold shrink-0">
                  Thực hiện: <span className="text-gray-700">{log.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

