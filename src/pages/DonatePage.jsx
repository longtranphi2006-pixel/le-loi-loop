import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, STATION_SLOTS } from '../data/seedData';
import { PlusCircle, Clock, Upload, CheckCircle2, AlertCircle, FileText, Sparkles, Image as ImageIcon } from 'lucide-react';

const SAMPLE_IMAGES = [
  { label: 'Sách giáo khoa Toán', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80' },
  { label: 'Truyện tranh', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80' },
  { label: 'Cặp balo học sinh', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80' },
  { label: 'Dụng cụ compa eke', url: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80' },
  { label: 'Hộp bút học sinh', url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80' },
  { label: 'Sách bài tập ôn tập', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80' },
  { label: 'Áo khoác đồng phục', url: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&auto=format&fit=crop&q=80' }
];

export default function DonatePage({ setActivePage }) {
  const { currentUser, addItem } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('sgk');
  const [condition, setCondition] = useState('Tốt');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(SAMPLE_IMAGES[0].url);
  const [availableSlots, setAvailableSlots] = useState(['T2_PM', 'T3_PM']);
  const [inputMethod, setInputMethod] = useState('website');
  const [customImageUrl, setCustomImageUrl] = useState('');

  const handleToggleSlot = (slotId) => {
    if (availableSlots.includes(slotId)) {
      setAvailableSlots(availableSlots.filter(s => s !== slotId));
    } else {
      setAvailableSlots([...availableSlots, slotId]);
    }
  };

  const handleSelectAllSlots = () => {
    if (availableSlots.length === STATION_SLOTS.length) {
      setAvailableSlots([]);
    } else {
      setAvailableSlots(STATION_SLOTS.map(s => s.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Vui lòng nhập tên món đồ!');
      return;
    }

    if (availableSlots.length === 0) {
      alert('Vui lòng chọn ít nhất 1 khung giờ bạn có thể gửi đồ tại Trạm!');
      return;
    }

    const finalImage = customImageUrl.trim() || image;

    addItem({
      title,
      category,
      condition,
      description,
      image: finalImage,
      availableSlots,
      inputMethod
    });

    setActivePage('my-activity');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
          Gieo mầm chia sẻ
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Đăng đồ muốn tặng cho bạn bè
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
          Mỗi cuốn sách, chiếc cặp hay cây bút cũ bạn trao đi sẽ tiếp tục chắp cánh cho bạn học khác tại THCS Lê Lợi.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin người gửi (Role hiện tại) */}
          <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500"
              />
              <div>
                <div className="text-xs text-gray-500 font-medium">Người gửi đăng:</div>
                <div className="text-sm font-bold text-gray-900">
                  {currentUser.name} ({currentUser.id})
                </div>
                <div className="text-xs text-emerald-800">
                  Lớp: {currentUser.class} • Buổi: {currentUser.shift}
                </div>
              </div>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-lg">
              Người cho (Donor)
            </span>
          </div>

          {/* Tên món đồ */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Tên món đồ <span className="text-red-500">*</span>:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Bộ Sách Giáo Khoa Ngữ Văn 7 (Bộ Kết nối tri thức)"
              className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Danh mục & Tình trạng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Danh mục đồ dùng:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-800 mb-1.5">
                Tình trạng hiện tại:
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Như mới">Như mới (95 - 99%)</option>
                <option value="Tốt">Tốt (80 - 90%)</option>
                <option value="Đã dùng còn tốt">Đã dùng còn tốt</option>
              </select>
            </div>
          </div>

          {/* Ảnh minh họa */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-800">
              Chọn ảnh minh họa hoặc nhập đường dẫn ảnh:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {SAMPLE_IMAGES.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setImage(img.url);
                    setCustomImageUrl('');
                  }}
                  className={`relative rounded-xl overflow-hidden h-20 border-2 transition-all ${
                    image === img.url && !customImageUrl
                      ? 'border-emerald-600 ring-2 ring-emerald-300'
                      : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] py-0.5 px-1 truncate text-center">
                    {img.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <input
                type="url"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                placeholder="Hoặc dán URL ảnh ngoài: https://..."
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Mô tả chi tiết món đồ:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi rõ số lượng cuốn sách, còn thiếu phụ kiện gì không, có bọc bìa không..."
              className="w-full text-xs p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Khung giờ có thể gửi đồ */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-gray-800">
                  Chọn các khung giờ bạn có thể mang đồ tới Trạm Lê Lợi <span className="text-red-500">*</span>:
                </label>
                <p className="text-[11px] text-gray-500">Thuật toán LoopMatch sẽ căn cứ vào đây để ghép nối lịch hẹn tối ưu</p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllSlots}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                {availableSlots.length === STATION_SLOTS.length ? 'Bỏ chọn hết' : 'Chọn tất cả ca'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl max-h-56 overflow-y-auto">
              {STATION_SLOTS.map(slot => {
                const isChecked = availableSlots.includes(slot.id);
                return (
                  <label
                    key={slot.id}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer border transition-all ${
                      isChecked
                        ? 'bg-emerald-100/90 border-emerald-400 font-semibold text-emerald-900 shadow-sm'
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

          {/* Hình thức nhập */}
          <div>
            <label className="block text-xs font-bold text-gray-800 mb-1.5">
              Hình thức đăng ký:
            </label>
            <div className="flex gap-4 text-xs font-medium text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="donateInputMethod"
                  value="website"
                  checked={inputMethod === 'website'}
                  onChange={() => setInputMethod('website')}
                />
                <span>Trực tuyến (Website THCS Lê Lợi)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="donateInputMethod"
                  value="paper"
                  checked={inputMethod === 'paper'}
                  onChange={() => setInputMethod('paper')}
                />
                <span>Số hóa từ Phiếu giấy tại trạm</span>
              </label>
            </div>
          </div>

          {/* Cảnh báo kiểm duyệt */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>LƯU Ý NGHIỆP VỤ KHKT:</strong> Sau khi nhấn đăng món, thông tin sẽ được đưa vào hàng đợi <em>"Chờ duyệt thông tin"</em>. Món đồ <strong>CHƯA hiển thị ngay</strong> trên Kho đồ công khai để đảm bảo kiểm duyệt nội dung bởi Thầy Nguyễn Văn A (GV01) hoặc Đội trực trạm CLB (TR01).
            </div>
          </div>

          {/* Nút bấm */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActivePage('catalog')}
              className="px-6 py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Gửi đăng món đồ (Chờ duyệt)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

