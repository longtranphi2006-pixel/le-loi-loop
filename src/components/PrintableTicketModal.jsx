import React from 'react';
import { Printer, X, QrCode, CheckCircle2, MapPin, Calendar, Clock, User, Package } from 'lucide-react';

export default function PrintableTicketModal({ ticket, onClose }) {
  if (!ticket) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Container của Modal */}
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 relative max-h-[92vh] overflow-y-auto print:p-0 print:m-0 print:shadow-none print:border-none print:max-h-none print:rounded-none">
        
        {/* Nút đóng (Ẩn khi in) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-all print:hidden"
          title="Đóng phiếu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ======================================================== */}
        {/* KHU VỰC PHIẾU IN ẤN THỰC TẾ (PRINTABLE AREA) */}
        {/* ======================================================== */}
        <div id="printable-ticket" className="border-2 border-dashed border-emerald-600 rounded-2xl p-6 sm:p-7 bg-emerald-50/20 space-y-5 print:border-solid print:border-black print:p-4 print:bg-white">
          
          {/* Header Phiếu */}
          <div className="text-center border-b-2 border-emerald-600 pb-3 space-y-1 print:border-black">
            <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-emerald-900 print:text-black">
              UBND QUẬN HẢI CHÂU • TRƯỜNG THCS LÊ LỢI • PHÒNG ĐOÀN ĐỘI
            </div>
            <h2 className="text-base sm:text-lg font-black text-emerald-800 uppercase print:text-black">
              PHIẾU HẸN TIẾP NHẬN HIỆN VẬT TẠI TRẠM
            </h2>
            <div className="text-[11px] text-gray-600 italic print:text-black">
              Dự án KHKT: <strong>Lê Lợi Loop</strong> — "Đồ cũ trao tay, Giá trị ở lại"
            </div>
          </div>

          {/* Mã tra cứu & QR Code */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-emerald-200 print:border-black print:bg-white shadow-sm">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] uppercase font-bold text-gray-500">Mã tra cứu biên nhận:</span>
              <div className="font-mono text-xl sm:text-2xl font-black text-emerald-800 tracking-wider print:text-black">
                {ticket.ticketCode || 'LL-2026'}
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold print:text-black">
                Trạng thái: <strong>Đã ghi nhận vào hàng đợi</strong>
              </div>
            </div>

            {/* Visual QR Code Generator */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-20 h-20 bg-white border border-gray-300 p-1.5 rounded-lg flex items-center justify-center shadow-inner print:border-black">
                <div className="w-full h-full bg-black relative flex items-center justify-center p-1 rounded-sm">
                  {/* Mô phỏng ô vuông QR góc */}
                  <div className="absolute top-1 left-1 w-3.5 h-3.5 bg-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-black"></div>
                  </div>
                  <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-black"></div>
                  </div>
                  <div className="absolute bottom-1 left-1 w-3.5 h-3.5 bg-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-black"></div>
                  </div>
                  <span className="text-[7px] text-white font-mono font-bold tracking-tighter">
                    {ticket.ticketCode?.slice(0, 7) || 'LL-LOOP'}
                  </span>
                </div>
              </div>
              <span className="text-[9px] text-gray-500 font-mono">Quét QR tại Trạm</span>
            </div>
          </div>

          {/* Chi tiết học sinh & món đồ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1 print:border-black">
              <div className="font-bold text-gray-700 flex items-center gap-1.5 border-b border-gray-100 pb-1 print:border-black">
                <User className="w-3.5 h-3.5 text-emerald-600 print:text-black" />
                <span>Học sinh đăng ký:</span>
              </div>
              <div>Họ tên: <strong>{ticket.studentName}</strong></div>
              <div>Mã HS: <strong>{ticket.studentId}</strong> • Lớp: <strong>{ticket.studentClass || 'THCS Lê Lợi'}</strong></div>
              <div>Buổi học chính: <strong>{ticket.studentShift || 'Sáng'}</strong></div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1 print:border-black">
              <div className="font-bold text-gray-700 flex items-center gap-1.5 border-b border-gray-100 pb-1 print:border-black">
                <Package className="w-3.5 h-3.5 text-emerald-600 print:text-black" />
                <span>Hiện vật / Đồ dùng:</span>
              </div>
              <div className="line-clamp-1">Tên món: <strong>{ticket.itemTitle}</strong></div>
              <div>Danh mục: <strong>{ticket.categoryName || 'Sách vở & Đồ dùng'}</strong></div>
              <div>Hình thức: <strong>Số hóa từ Phiếu giấy</strong></div>
            </div>
          </div>

          {/* Khung giờ hẹn nộp tại trạm */}
          <div className="bg-emerald-100/70 p-3.5 rounded-xl border border-emerald-300 text-xs space-y-1.5 print:border-black print:bg-gray-100">
            <div className="flex items-center gap-1.5 font-bold text-emerald-950 print:text-black">
              <Clock className="w-4 h-4 text-emerald-800 print:text-black" />
              <span>Khung giờ bạn có thể mang đồ tới Trạm Lê Lợi:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {ticket.slots && ticket.slots.length > 0 ? (
                ticket.slots.map((s, idx) => (
                  <span key={idx} className="bg-white px-2 py-0.5 rounded-md font-semibold text-emerald-900 border border-emerald-300 print:border-black">
                    {s}
                  </span>
                ))
              ) : (
                <span className="font-semibold text-emerald-900">Giờ ra chơi hoặc sau ca học tại Phòng Đội</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-600 pt-1 print:text-black">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 print:text-black" />
              <span>Địa điểm: <strong>Bàn trực Trạm Lê Lợi Loop — Phòng Đoàn Đội THCS Lê Lợi</strong></span>
            </div>
          </div>

          {/* Lời dặn */}
          <div className="text-[11px] text-gray-500 italic text-center print:text-black">
            * Học sinh giữ phiếu này hoặc chụp màn hình điện thoại, mang hiện vật đến Trạm để Đội trực kiểm tra và gán ô lưu trữ K1.
          </div>
        </div>

        {/* Nút hành động (Ẩn khi in) */}
        <div className="flex gap-3 pt-2 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all"
          >
            Đóng phiếu
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>In phiếu hẹn / Lưu PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
