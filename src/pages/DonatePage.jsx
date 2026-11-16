import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { CATEGORIES, STATION_SLOTS } from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import PrintableTicketModal from '../components/PrintableTicketModal';
import {
  PlusCircle,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Camera,
  Check,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

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

  if (!currentUser) {
    return null;
  }

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('sgk');
  const [condition, setCondition] = useState('Tốt');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(SAMPLE_IMAGES[0].url);
  const [availableSlots, setAvailableSlots] = useState(['T2_PM', 'T3_PM']);
  const [inputMethod, setInputMethod] = useState('website');
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Trạng thái upload ảnh
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploadedPreview, setUploadedPreview] = useState(null);

  // Trạng thái Phiếu hẹn in ấn
  const [generatedTicket, setGeneratedTicket] = useState(null);

  // Tự động điền & gợi ý khung giờ rảnh theo buổi học chính (study_shift) của hồ sơ
  useEffect(() => {
    if (currentUser?.shift) {
      if (currentUser.shift === 'Sáng') {
        const pmSlots = STATION_SLOTS.filter(s => s.period === 'PM').map(s => s.id);
        setAvailableSlots(pmSlots.length > 0 ? pmSlots : ['T2_PM', 'T3_PM']);
      } else if (currentUser.shift === 'Chiều') {
        const amSlots = STATION_SLOTS.filter(s => s.period === 'AM').map(s => s.id);
        setAvailableSlots(amSlots.length > 0 ? amSlots : ['T2_AM', 'T3_AM']);
      }
    }
  }, [currentUser?.shift, currentUser?.id]);

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

  // Nén ảnh tự động qua HTML5 Canvas (< 500KB)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              resolve({ blob, dataUrl: canvas.toDataURL('image/jpeg', 0.82) });
            },
            'image/jpeg',
            0.82
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Xử lý upload ảnh từ máy hoặc chụp từ camera điện thoại
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadMsg('Đang nén ảnh nhẹ (< 500KB)...');
      const { blob, dataUrl } = await compressImage(file);
      setUploadedPreview(dataUrl);

      // Thử upload lên Supabase Storage bucket 'item-images'
      if (isSupabaseConfigured && supabase?.storage) {
        setUploadMsg('Đang tải lên Supabase Storage...');
        const cleanName = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
        const { data, error } = await supabase.storage.from('item-images').upload(cleanName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

        if (!error && data) {
          const { data: pubData } = supabase.storage.from('item-images').getPublicUrl(cleanName);
          if (pubData?.publicUrl) {
            setImage(pubData.publicUrl);
            setCustomImageUrl('');
            setUploadMsg(`✓ Đã tải lên Supabase Storage (${(blob.size / 1024).toFixed(0)} KB)!`);
            return;
          }
        }
      }

      // Fallback Base64 an toàn nếu chưa tạo bucket Storage
      setImage(dataUrl);
      setCustomImageUrl('');
      setUploadMsg(`✓ Đã tối ưu ảnh sẵn sàng (${(blob.size / 1024).toFixed(0)} KB)!`);
    } catch (err) {
      console.warn('Lỗi xử lý ảnh:', err);
      setUploadMsg('Không thể xử lý ảnh, hãy thử ảnh khác hoặc chọn ảnh mẫu.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
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

    const newId = await addItem({
      title,
      category,
      condition,
      description,
      image: finalImage,
      availableSlots,
      inputMethod
    });

    // Nếu chọn hình thức phiếu giấy tại trạm -> Hiển thị Mẫu Phiếu Hẹn In Ấn
    if (inputMethod === 'paper') {
      const slotLabels = availableSlots.map(s => STATION_SLOTS.find(sl => sl.id === s)?.label || s);
      const catObj = CATEGORIES.find(c => c.id === category);
      setGeneratedTicket({
        ticketCode: `LL-2026-${(newId || 'ITEM').slice(-4)}`,
        studentName: currentUser.name,
        studentId: currentUser.id,
        studentClass: currentUser.class,
        studentShift: currentUser.shift,
        itemTitle: title,
        categoryName: catObj?.name,
        slots: slotLabels
      });
      return;
    }

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
          {/* Thông tin người gửi */}
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
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

          {/* Upload ảnh thật từ máy / Camera điện thoại */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-800">
                Hình ảnh hiện vật (Tải ảnh thật hoặc chọn ảnh mẫu):
              </label>
              <span className="text-[11px] text-gray-500">Tự động nén &lt; 500KB</span>
            </div>

            {/* Khung nút upload ảnh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-sm transition-all active:scale-95 shrink-0">
                <Camera className="w-4 h-4" />
                <span>{isUploading ? 'Đang nén & Tải...' : 'Tải ảnh từ máy / Chụp camera'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {uploadMsg && (
                <div className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 truncate">
                  {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" /> : <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  <span>{uploadMsg}</span>
                </div>
              )}
            </div>

            {/* Preview ảnh vừa upload */}
            {uploadedPreview && (
              <div className="flex items-center gap-3 p-2 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <img src={uploadedPreview} alt="Ảnh tải lên" className="w-14 h-14 rounded-lg object-cover ring-1 ring-emerald-400" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-900">Ảnh tải lên đã sẵn sàng!</span>
                  <div className="text-[11px] text-gray-500">Ảnh này sẽ đại diện cho hiện vật khi đăng lên Kho đồ.</div>
                </div>
              </div>
            )}

            {/* Danh sách ảnh mẫu minh họa */}
            <div className="pt-1">
              <div className="text-[11px] font-semibold text-gray-500 mb-1.5">Hoặc chọn nhanh từ thư viện mẫu:</div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {SAMPLE_IMAGES.map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setImage(img.url);
                      setCustomImageUrl('');
                      setUploadedPreview(null);
                      setUploadMsg('');
                    }}
                    className={`relative rounded-xl overflow-hidden h-20 border-2 transition-all ${
                      image === img.url && !customImageUrl && !uploadedPreview
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
            </div>

            <div>
              <input
                type="url"
                value={customImageUrl}
                onChange={(e) => {
                  setCustomImageUrl(e.target.value);
                  setUploadedPreview(null);
                }}
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
                <span className="font-bold text-emerald-800">Số hóa từ Phiếu giấy tại trạm (Xuất phiếu in)</span>
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

      {/* MODAL PHIẾU HẸN IN ẤN (PRINTABLE TICKET MODAL) */}
      {generatedTicket && (
        <PrintableTicketModal
          ticket={generatedTicket}
          onClose={() => {
            setGeneratedTicket(null);
            setActivePage('my-activity');
          }}
        />
      )}
    </div>
  );
}
