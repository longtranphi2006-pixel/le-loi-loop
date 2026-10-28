import React from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../data/seedData';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  BookMarked,
  Briefcase,
  PenTool,
  Shirt,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
  Cpu,
  Layers,
  HeartHandshake
} from 'lucide-react';

const iconMap = {
  BookOpen,
  BookMarked,
  Sparkles,
  Briefcase,
  PenTool,
  Shirt
};

export default function HomePage({ setActivePage, setSelectedCategory, setSelectedItem }) {
  const { items, currentUser } = useApp();

  const featuredItems = items
    .filter(i => i.status === 'approved' && i.requestStatus === 'open')
    .slice(0, 4);

  return (
    <div className="space-y-12 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 text-white p-8 sm:p-12 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-600/60 backdrop-blur-md border border-emerald-400/40 text-emerald-100 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Đề tài Nghiên cứu KHKT THCS Lê Lợi – Đà Nẵng
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            LÊ LỢI LOOP
            <span className="block text-amber-300 text-2xl sm:text-3xl font-medium mt-1">
              "Đồ cũ trao tay – Giá trị ở lại"
            </span>
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-2xl">
            Nền tảng ghép nối và điều phối thông minh đồ dùng học tập, sách vở, đồng phục cũ trong học sinh THCS. Giải quyết triệt để vấn đề lệch ca học (Sáng – Chiều) nhờ trạm lưu giữ trung chuyển thông minh và thuật toán xếp lịch tự động.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActivePage('catalog')}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-900/20 transition-all hover:scale-105 active:scale-95 text-sm"
            >
              <span>Khám phá kho đồ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('donate')}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-6 py-3 rounded-xl backdrop-blur-md transition-all text-sm"
            >
              <span>Đăng đồ muốn tặng</span>
            </button>
            <button
              onClick={() => setActivePage('loopmatch')}
              className="inline-flex items-center gap-2 bg-emerald-950/40 hover:bg-emerald-950/60 text-emerald-200 border border-emerald-500/30 font-semibold px-5 py-3 rounded-xl backdrop-blur-md transition-all text-sm"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Xem thuật toán LoopMatch</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* STATS COUNTER (Ghi rõ số liệu mô phỏng KHKT) */}
      <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Chỉ số vận hành hệ thống
            </h2>
          </div>
          <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2.5 py-1 rounded-md border border-amber-200">
            Số liệu mô phỏng thực nghiệm KHKT
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700">128</div>
            <div className="text-xs text-gray-600 font-medium mt-1">Món đồ đã đăng tải</div>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-700">96</div>
            <div className="text-xs text-gray-600 font-medium mt-1">Món đã trao thành công</div>
          </div>
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-700">74</div>
            <div className="text-xs text-gray-600 font-medium mt-1">Học sinh tích cực tham gia</div>
          </div>
          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100 text-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-teal-700">1 Trạm</div>
            <div className="text-xs text-gray-600 font-medium mt-1">Kệ lưu trữ 10 ô K1-A1..B5</div>
          </div>
        </div>
      </section>

      {/* DANH MỤC NHANH */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Danh mục đồ dùng cần trao đổi</h2>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setActivePage('catalog');
            }}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Xem toàn bộ kho đồ <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map(cat => {
            const Icon = iconMap[cat.icon] || BookOpen;
            const count = items.filter(i => i.category === cat.id && i.status === 'approved').length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setActivePage('catalog');
                }}
                className="flex flex-col items-center justify-center p-4 bg-white hover:bg-emerald-50/50 border border-gray-200/80 hover:border-emerald-300 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5 text-center group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110 ${cat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-gray-800 leading-tight mb-1">
                  {cat.name}
                </span>
                <span className="text-[11px] text-gray-400">
                  {count} món sẵn có
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* MÓN ĐỒ NỔI BẬT CÒN MỞ YÊU CẦU */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Món đồ đang chờ trao nhận</h2>
            <p className="text-xs text-gray-500">Đã được giáo viên phê duyệt thông tin, sẵn sàng nhận yêu cầu từ học sinh</p>
          </div>
          <button
            onClick={() => setActivePage('catalog')}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Xem tất cả ({items.filter(i => i.status === 'approved').length})
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredItems.map(item => (
            <div
              key={item.id}
              className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group"
            >
              <div className="relative h-44 bg-gray-100 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                    {item.condition}
                  </span>
                  {item.inputMethod === 'paper' && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                      Phiếu giấy
                    </span>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
                  {item.id}
                </div>
              </div>

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

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-[11px] text-gray-500">
                    Người tặng: <span className="font-semibold text-gray-700">{item.donorId}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setActivePage('detail');
                    }}
                    className="text-xs bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUY TRÌNH 4 BƯỚC KHÉP KÍN */}
      <section className="bg-gradient-to-b from-white to-emerald-50/30 border border-emerald-100 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Mô hình vận hành
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Quy trình điều phối 4 bước tại THCS Lê Lợi
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Được nghiên cứu và thiết kế tối ưu cho môi trường học đường – Đảm bảo minh bạch, công bằng và tiện lợi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-base">
              1
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Đăng đồ & Gửi phiếu</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Học sinh đăng ký tặng đồ trực tuyến hoặc điền phiếu giấy tại bàn trực trạm Lê Lợi, chọn các ca rảnh trong tuần.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-base">
              2
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Kiểm duyệt thông tin</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Giáo viên và Đội trực kiểm duyệt nội dung món đồ, xác nhận phù hợp với quy định trước khi mở đợt nhận yêu cầu.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-base">
              3
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Bốc thăm & LoopMatch</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Nếu có nhiều bạn cùng cần, hệ thống bốc thăm công bằng. Thuật toán LoopMatch tự động tìm ca hẹn phù hợp nhất.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm relative space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-base">
              4
            </div>
            <h3 className="font-bold text-gray-900 text-sm">Kiểm tra & Bàn giao</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Kiểm tra đồ thực tế tại trạm, cất vào kệ K1 hoặc trao trực tiếp. Người nhận quét mã để hoàn tất thủ tục.
            </p>
          </div>
        </div>
      </section>

      {/* GIẢI THÍCH CHO HỌC SINH KHÔNG DÙNG ĐIỆN THOẠI THÔNG MINH (Offline Paper Workflow) */}
      <section className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-200">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="inline-block text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded uppercase">
              Giải pháp hòa nhập cho mọi học sinh
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-amber-950">
              Bạn không có điện thoại thông minh? Đừng lo lắng!
            </h3>
            <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
              Quy chế trường THCS Lê Lợi hạn chế học sinh sử dụng điện thoại tại trường. Vì vậy, nhóm nghiên cứu KHKT đã thiết kế quy trình <strong>"Phiếu trao nhận giấy"</strong> song hành:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white/90 p-3 rounded-xl border border-amber-200">
                <strong>1. Điền phiếu giấy:</strong> Lấy mẫu phiếu tại Bàn trực trạm (hoặc tại GVCN), ghi tên món đồ và giờ ra chơi rảnh.
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-amber-200">
                <strong>2. Số hóa thông tin:</strong> Tình nguyện viên CLB Lê Lợi sẽ nhập dữ liệu phiếu giấy lên hệ thống máy tính của trường.
              </div>
              <div className="bg-white/90 p-3 rounded-xl border border-amber-200">
                <strong>3. Xem bảng tin trạm:</strong> Danh sách kết quả và thẻ hẹn giấy được dán công khai tại Bảng tin Trạm Lê Lợi Loop mỗi ngày.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

