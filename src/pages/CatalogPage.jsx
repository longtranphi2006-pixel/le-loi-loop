import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/seedData';
import { Search, Filter, Sparkles, BookOpen, Clock, Tag, CheckCircle2, AlertCircle, PlusCircle, Package, Trash2, AlertTriangle, X, ShieldCheck, Shield } from 'lucide-react';

export default function CatalogPage({ selectedCategory, setSelectedCategory, setSelectedItem, setActivePage }) {
  const { items, currentUser, deleteItem, openAuthModal } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Phân quyền: Cán bộ Quản lý trạm (station_staff), Giáo viên (teacher) hoặc Admin có quyền xóa món đồ
  const canDelete = Boolean(currentUser && (currentUser.role === 'station_staff' || currentUser.role === 'teacher' || currentUser.role === 'admin'));

  // Lọc danh sách món đồ
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Chỉ hiển thị các món đã được duyệt, hoặc đang lưu trạm, trừ khi lọc riêng
      const isApprovedOrActive = item.status === 'approved' || item.status === 'matching' || item.status === 'stored' || item.status === 'completed';
      if (!isApprovedOrActive) return false;

      // Từ khóa
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(term);
        const matchDesc = item.description?.toLowerCase().includes(term);
        const matchId = item.id.toLowerCase().includes(term);
        if (!matchTitle && !matchDesc && !matchId) return false;
      }

      // Danh mục
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Tình trạng
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) {
        return false;
      }

      // Trạng thái đợt nhận
      if (selectedStatus === 'open' && (item.requestStatus !== 'open' || item.status !== 'approved')) {
        return false;
      }
      if (selectedStatus === 'closed' && item.requestStatus === 'open' && item.status === 'approved') {
        return false;
      }

      return true;
    });
  }, [items, searchTerm, selectedCategory, selectedCondition, selectedStatus]);

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Kho đồ dùng trao nhận
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Nơi lưu chuyển sách vở, dụng cụ học tập và đồng phục cho học sinh THCS Lê Lợi
          </p>
        </div>
        <div className="text-xs font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto">
          Hiện có <strong>{filteredItems.length}</strong> món phù hợp
        </div>
      </div>

      {/* BANNER HƯỚNG DẪN / PHÂN QUYỀN XÓA MÓN ĐỒ */}
      {canDelete ? (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-950 animate-fadeIn shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold flex items-center gap-2">
                <span>Chế độ Quản lý Trạm đã kích hoạt</span>
                <span className="bg-red-200 text-red-900 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {currentUser.role === 'admin' ? 'Quản trị viên (Admin)' : currentUser.role === 'teacher' ? 'Giáo viên phụ trách' : 'Cán bộ trực trạm'}
                </span>
              </div>
              <p className="text-[11px] text-red-700 mt-0.5">
                Nút <span className="font-bold text-red-800 bg-red-100 px-1.5 py-0.2 rounded border border-red-300">[Xóa]</span> màu đỏ đã hiển thị nổi bật trên từng món đồ trong kho. Bạn có thể xóa bất kỳ món đồ nào khỏi hệ thống.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono font-semibold bg-white px-3 py-1.5 rounded-xl border border-red-200 shrink-0 self-start sm:self-auto text-gray-700">
            {currentUser.name} ({currentUser.id})
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {currentUser
                ? `Bạn đang đăng nhập với vai trò Học sinh (${currentUser.name}). Chỉ tài khoản Quản lý trạm/Admin mới thấy nút Xóa món đồ.`
                : 'Bạn đang xem kho ở chế độ Khách. Để xóa món đồ, vui lòng đăng nhập tài khoản Quản lý trạm / Admin (Ví dụ: admin/admin hoặc TR01).'}
            </span>
          </div>
          <button
            onClick={() => openAuthModal('login')}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs shrink-0 shadow-sm"
          >
            {currentUser ? 'Đổi tài khoản' : 'Đăng nhập Quản lý'}
          </button>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword search input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm sách Toán, balo, hộp bút, mã M001..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                Xóa
              </button>
            )}
          </div>

          {/* Condition filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Tình trạng:</span>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả tình trạng</option>
              <option value="Như mới">Như mới (95-99%)</option>
              <option value="Tốt">Tốt (80-90%)</option>
              <option value="Đã dùng còn tốt">Đã dùng còn tốt</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="open">Đang mở nhận yêu cầu</option>
              <option value="closed">Đang xét duyệt / Đã bàn giao</option>
            </select>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-gray-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả danh mục
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ITEMS GRID */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-4 max-w-lg mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-100">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Kho đồ hiện chưa có món nào</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Kho đồ đang trống. Hãy là học sinh đầu tiên chia sẻ đồ dùng học tập của mình để lan tỏa tinh thần sẻ chia nhé!
          </p>
          <button
            onClick={() => setActivePage('donate')}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Đăng món đồ đầu tiên</span>
          </button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-700">Không tìm thấy món đồ phù hợp</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc để xem các đồ dùng khác.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedCondition('all');
              setSelectedStatus('all');
            }}
            className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            Xóa toàn bộ bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredItems.map(item => {
            const isAvailable = item.status === 'approved' && item.requestStatus === 'open';
            const isCompleted = item.status === 'completed';
            const isMatching = item.status === 'matching';
            const isStored = item.status === 'stored';

            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
              >
                {/* Image & Badges */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                    {isAvailable && (
                      <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Còn nhận yêu cầu
                      </span>
                    )}
                    {isMatching && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Đang điều phối
                      </span>
                    )}
                    {isStored && (
                      <span className="bg-teal-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                        Lưu trạm {item.storageSlot}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="bg-gray-700 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                        Đã bàn giao
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      {item.id}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setItemToDelete(item);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-md transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                        title="Xóa món đồ khỏi kho chung (Chỉ dành cho Quản lý trạm)"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>

                  <div className="absolute bottom-2 left-2 flex gap-1">
                    <span className="bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded shadow">
                      {item.condition}
                    </span>
                    {item.inputMethod === 'paper' && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
                        Phiếu giấy
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                      {CATEGORIES.find(c => c.id === item.category)?.name}
                    </div>
                    <h3 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Người tặng: <strong className="text-gray-700">{item.donorId}</strong></span>
                      <span>{item.createdAt.split(' ')[0]}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setActivePage('detail');
                        }}
                        className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white transition-all shadow-sm"
                      >
                        Xem chi tiết & Gửi yêu cầu
                      </button>

                      {canDelete && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(item);
                          }}
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-md shadow-red-200 flex items-center justify-center gap-1.5 shrink-0 hover:scale-105 active:scale-95"
                          title="Xóa món này khỏi kho chung (Chỉ dành cho Quản lý trạm)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL XÁC NHẬN XÓA MÓN ĐỒ (CHỈ DÀNH CHO QUẢN LÝ TRẠM & ADMIN) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-red-100 overflow-hidden relative">
            {/* Header modal */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Xóa món đồ khỏi kho</h3>
                  <p className="text-[11px] text-red-100 mt-0.5">Phân quyền: Người quản lý trạm</p>
                </div>
              </div>
              <button
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="text-red-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nội dung modal */}
            <div className="p-5 space-y-4">
              <div className="flex gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                <img
                  src={itemToDelete.image}
                  alt={itemToDelete.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-gray-200"
                />
                <div className="text-xs overflow-hidden">
                  <div className="font-bold text-gray-900 truncate">{itemToDelete.title}</div>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5">Mã: {itemToDelete.id}</div>
                  <div className="text-[11px] text-gray-500">Người tặng: {itemToDelete.donorName || itemToDelete.donorId}</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Tình trạng: {itemToDelete.condition}</div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Cảnh báo từ hệ thống:</div>
                  <p className="text-[11px] leading-relaxed">
                    Bạn đang thực hiện xóa món đồ này khỏi kho dùng chung. Dữ liệu trên Supabase Cloud và mọi lịch hẹn, yêu cầu liên quan sẽ bị hủy bỏ vĩnh viễn.
                  </p>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    await deleteItem(itemToDelete.id);
                    setIsDeleting(false);
                    setItemToDelete(null);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-md shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xóa...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Xác nhận xóa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

