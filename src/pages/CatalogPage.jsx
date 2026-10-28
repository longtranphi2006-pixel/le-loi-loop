import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/seedData';
import { Search, Filter, Sparkles, BookOpen, Clock, Tag, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CatalogPage({ selectedCategory, setSelectedCategory, setSelectedItem, setActivePage }) {
  const { items } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

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
      {filteredItems.length === 0 ? (
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

                  <div className="absolute top-2.5 right-2.5 flex gap-1">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono px-2 py-0.5 rounded">
                      {item.id}
                    </span>
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

                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setActivePage('detail');
                      }}
                      className="w-full text-center py-2 px-3 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-600 text-emerald-800 hover:text-white transition-all shadow-sm"
                    >
                      Xem chi tiết & Gửi yêu cầu
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

