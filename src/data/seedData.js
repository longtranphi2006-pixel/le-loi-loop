// DỮ LIỆU BAN ĐẦU (SEED DATA) PHỤC VỤ DỰ ÁN KHKT THCS "LÊ LỢI LOOP"
// Khẩu hiệu: "Đồ cũ trao tay – Giá trị ở lại"

export const USERS = [
  {
    id: 'HS001',
    name: 'Trần Bảo An',
    role: 'student',
    class: '7/1',
    shift: 'Sáng', // Học buổi sáng (rảnh chiều / ra chơi sáng)
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '0905.123.456 (hoặc qua GVCN)',
    points: 15,
    bio: 'Học sinh lớp 7/1 – Đam mê đọc sách và chia sẻ đồ dùng học tập cũ'
  },
  {
    id: 'HS002',
    name: 'Lê Hoàng Nam',
    role: 'student',
    class: '8/2',
    shift: 'Chiều', // Học buổi chiều (rảnh sáng / ra chơi chiều)
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    phone: '0914.789.012 (hoặc qua GVCN)',
    points: 20,
    bio: 'Học sinh lớp 8/2 – Yêu thích nghiên cứu khoa học kỹ thuật và hoạt động xanh'
  },
  {
    id: 'TR01',
    name: 'CLB Tình nguyện Lê Lợi (Đội trực trạm)',
    role: 'station_staff',
    class: 'Đội Tình Nguyện THCS Lê Lợi',
    shift: 'Cả ngày (Theo ca trực)',
    avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80',
    phone: 'Trực tại Phòng Đội / Trạm KHKT',
    points: 120,
    bio: 'Tổ xung kích kiểm tra chất lượng đồ dùng, phân loại và điều phối trao nhận tại trạm'
  },
  {
    id: 'GV01',
    name: 'Thầy Nguyễn Văn A',
    role: 'teacher',
    class: 'Giáo viên phụ trách KHKT',
    shift: 'Toàn thời gian',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: 'Văn phòng Đoàn Đội / Hội đồng SP',
    points: 250,
    bio: 'Giáo viên hướng dẫn đề tài KHKT "Lê Lợi Loop" – Quản lý, phê duyệt và giám sát hệ thống'
  }
];

// 10 Ca trực trạm trong tuần tại Trường THCS Lê Lợi
export const STATION_SLOTS = [
  { id: 'T2_AM', day: 'Thứ 2', shift: 'Sáng', time: '09:15 - 10:00', label: 'Thứ 2 - Sáng (09:15 - 10:00)', dayIndex: 1, period: 'AM' },
  { id: 'T2_PM', day: 'Thứ 2', shift: 'Chiều', time: '14:00 - 14:45', label: 'Thứ 2 - Chiều (14:00 - 14:45)', dayIndex: 1, period: 'PM' },
  { id: 'T3_AM', day: 'Thứ 3', shift: 'Sáng', time: '09:15 - 10:00', label: 'Thứ 3 - Sáng (09:15 - 10:00)', dayIndex: 2, period: 'AM' },
  { id: 'T3_PM', day: 'Thứ 3', shift: 'Chiều', time: '14:00 - 14:45', label: 'Thứ 3 - Chiều (14:00 - 14:45)', dayIndex: 2, period: 'PM' },
  { id: 'T4_AM', day: 'Thứ 4', shift: 'Sáng', time: '09:15 - 10:00', label: 'Thứ 4 - Sáng (09:15 - 10:00)', dayIndex: 3, period: 'AM' },
  { id: 'T4_PM', day: 'Thứ 4', shift: 'Chiều', time: '14:00 - 14:45', label: 'Thứ 4 - Chiều (14:00 - 14:45)', dayIndex: 3, period: 'PM' },
  { id: 'T5_AM', day: 'Thứ 5', shift: 'Sáng', time: '09:15 - 10:00', label: 'Thứ 5 - Sáng (09:15 - 10:00)', dayIndex: 4, period: 'AM' },
  { id: 'T5_PM', day: 'Thứ 5', shift: 'Chiều', time: '14:00 - 14:45', label: 'Thứ 5 - Chiều (14:00 - 14:45)', dayIndex: 4, period: 'PM' },
  { id: 'T6_AM', day: 'Thứ 6', shift: 'Sáng', time: '09:15 - 10:00', label: 'Thứ 6 - Sáng (09:15 - 10:00)', dayIndex: 5, period: 'AM' },
  { id: 'T6_PM', day: 'Thứ 6', shift: 'Chiều', time: '14:00 - 14:45', label: 'Thứ 6 - Chiều (14:00 - 14:45)', dayIndex: 5, period: 'PM' },
];

// 10 Vị trí lưu trữ tại Trạm Lê Lợi Loop (Kệ K1)
export const STORAGE_SLOTS = [
  'K1-A1', 'K1-A2', 'K1-A3', 'K1-A4', 'K1-A5',
  'K1-B1', 'K1-B2', 'K1-B3', 'K1-B4', 'K1-B5'
];

export const CATEGORIES = [
  { id: 'sgk', name: 'Sách giáo khoa', icon: 'BookOpen', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'stk', name: 'Sách tham khảo & Ôn thi', icon: 'BookMarked', color: 'bg-blue-100 text-blue-800' },
  { id: 'truyen', name: 'Truyện tranh & Văn học', icon: 'Sparkles', color: 'bg-amber-100 text-amber-800' },
  { id: 'cap', name: 'Cặp & Balo học sinh', icon: 'Briefcase', color: 'bg-purple-100 text-purple-800' },
  { id: 'dungcu', name: 'Dụng cụ học tập', icon: 'PenTool', color: 'bg-rose-100 text-rose-800' },
  { id: 'dongphuc', name: 'Đồng phục & Áo khoác', icon: 'Shirt', color: 'bg-teal-100 text-teal-800' },
];

export const INITIAL_ITEMS = [
  {
    id: 'M001',
    title: 'Bộ Sách Toán 7 (Bộ Chân trời sáng tạo)',
    category: 'sgk',
    condition: 'Tốt', // 'Như mới' | 'Tốt' | 'Đã dùng còn tốt'
    description: 'Trọn bộ 2 tập Toán 7 Chân trời sáng tạo, có bọc bìa nilon cẩn thận, không bị rách trang hay vẽ bậy. Rất phù hợp cho các bạn chuẩn bị lên lớp 7.',
    donorId: 'HS001',
    donorName: 'Trần Bảo An (7/1)',
    availableSlots: ['T2_PM', 'T3_PM', 'T4_PM'], // Buổi chiều
    inputMethod: 'website', // 'website' | 'paper'
    status: 'approved', // 'pending' | 'approved' | 'matching' | 'stored' | 'completed' | 'rejected'
    requestStatus: 'open', // 'open' (còn nhận yêu cầu) | 'closed' (tạm đóng xét duyệt)
    createdAt: '2026-10-24 08:30',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80',
    qualityCheck: { passed: true, note: 'Bìa đẹp, đầy đủ trang, không rách', checkedBy: 'TR01' },
    storageSlot: null
  },
  {
    id: 'M002',
    title: 'Bộ truyện Doraemon ngắn (10 cuốn tuyển chọn)',
    category: 'truyen',
    condition: 'Đã dùng còn tốt',
    description: '10 tập truyện tranh Doraemon bản đen trắng Kim Đồng, đọc giải trí lành mạnh sau giờ học căng thẳng. Giấy còn sáng rõ, bìa nguyên vẹn.',
    donorId: 'HS001',
    donorName: 'Trần Bảo An (7/1)',
    availableSlots: ['T3_PM', 'T5_PM'],
    inputMethod: 'website',
    status: 'approved',
    requestStatus: 'open',
    createdAt: '2026-10-24 10:15',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  },
  {
    id: 'M003',
    title: 'Cặp học sinh màu đen chống gù lưng',
    category: 'cap',
    condition: 'Đã dùng còn tốt',
    description: 'Cặp màu đen quai đệm êm, khóa kéo hoạt động trơn tru, nhiều ngăn đựng sách vở và bình nước. Đã giặt sạch sẽ thơm tho.',
    donorId: 'HS002',
    donorName: 'Lê Hoàng Nam (8/2)',
    availableSlots: ['T2_AM', 'T4_AM', 'T6_AM'],
    inputMethod: 'paper',
    status: 'approved',
    requestStatus: 'open',
    createdAt: '2026-10-25 09:00',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  },
  {
    id: 'M004',
    title: 'Sách Tiếng Anh 7 Global Success (Tập 1 & 2)',
    category: 'sgk',
    condition: 'Tốt',
    description: 'Sách giáo khoa Tiếng Anh 7 chương trình mới, chữ in rõ nét, một vài bài tập có điền bút chì mờ có thể tẩy được.',
    donorId: 'HS002',
    donorName: 'Lê Hoàng Nam (8/2)',
    availableSlots: ['T3_AM', 'T5_AM'],
    inputMethod: 'website',
    status: 'pending', // Chờ duyệt thông tin
    requestStatus: 'closed',
    createdAt: '2026-10-26 14:20',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  },
  {
    id: 'M005',
    title: 'Hộp bút nhiều ngăn kèm bộ thước kẻ Deli',
    category: 'dungcu',
    condition: 'Đã dùng còn tốt',
    description: 'Hộp bút vải Canvas bền bỉ, kèm eke, thước thẳng 20cm và thước đo độ. Món đồ đã tìm được chủ nhân mới thành công qua trạm!',
    donorId: 'HS001',
    donorName: 'Trần Bảo An (7/1)',
    availableSlots: ['T2_PM'],
    inputMethod: 'website',
    status: 'completed', // Đã bàn giao hoàn tất
    requestStatus: 'closed',
    createdAt: '2026-10-20 09:30',
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80',
    qualityCheck: { passed: true, note: 'Khóa tốt, thước không sứt mẻ', checkedBy: 'GV01' },
    storageSlot: null
  },
  {
    id: 'M006',
    title: 'Bộ Compa và Eke vẽ kỹ thuật KHKT',
    category: 'dungcu',
    condition: 'Như mới',
    description: 'Hộp compa kim loại chuyên dụng kèm ngòi chì thay thế, eke góc chuẩn. Đang được lưu giữ an toàn tại kệ trạm để bàn giao.',
    donorId: 'HS001',
    donorName: 'Trần Bảo An (7/1)',
    availableSlots: ['T2_PM', 'T4_PM'],
    inputMethod: 'website',
    status: 'stored', // Đang lưu trữ tại trạm
    requestStatus: 'closed',
    createdAt: '2026-10-23 15:00',
    image: 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80',
    qualityCheck: { passed: true, note: 'Đạt kiểm tra thực tế, ngòi tốt', checkedBy: 'TR01' },
    storageSlot: 'K1-A1'
  },
  {
    id: 'M007',
    title: 'Vở bài tập Ngữ văn 8 tập 1 (Chân trời sáng tạo)',
    category: 'stk',
    condition: 'Như mới',
    description: 'Sách bài tập mới 99%, chưa viết chữ nào do mua thừa đầu năm học.',
    donorId: 'HS002',
    donorName: 'Lê Hoàng Nam (8/2)',
    availableSlots: ['T3_AM', 'T4_AM', 'T5_AM'],
    inputMethod: 'website',
    status: 'approved',
    requestStatus: 'open',
    createdAt: '2026-10-25 11:30',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  },
  {
    id: 'M008',
    title: 'Balo chống nước thời trang học sinh',
    category: 'cap',
    condition: 'Đã dùng còn tốt',
    description: 'Balo màu xanh than, vải dù trượt nước, khóa số an toàn, thích hợp cho học sinh khối 6-7 mang sách vở nặng.',
    donorId: 'HS001',
    donorName: 'Trần Bảo An (7/1)',
    availableSlots: ['T2_PM', 'T3_PM'],
    inputMethod: 'paper',
    status: 'matching', // Đã chốt lịch, đang chờ đến trạm
    requestStatus: 'closed',
    createdAt: '2026-10-22 16:00',
    image: 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  },
  {
    id: 'M009',
    title: 'Áo khoác đồng phục THCS Lê Lợi (Size M)',
    category: 'dongphuc',
    condition: 'Tốt',
    description: 'Áo khoác gió mùa đông logo trường THCS Lê Lợi, khóa kéo tốt, cổ áo sạch sẽ, vừa vặn bạn nặng 42-50kg.',
    donorId: 'HS002',
    donorName: 'Lê Hoàng Nam (8/2)',
    availableSlots: ['T4_AM', 'T6_AM'],
    inputMethod: 'website',
    status: 'approved',
    requestStatus: 'open',
    createdAt: '2026-10-25 13:40',
    image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  },
  {
    id: 'M010',
    title: 'Từ điển Anh - Việt 55.000 từ bỏ túi',
    category: 'stk',
    condition: 'Như mới',
    description: 'Cuốn từ điển tra cứu nhanh cho môn Ngoại ngữ, bìa da dẻo bền bỉ, in đẹp, tiện lợi mang theo trong cặp.',
    donorId: 'HS001',
    donorName: 'Trần Bảo An (7/1)',
    availableSlots: ['T3_PM', 'T5_PM'],
    inputMethod: 'website',
    status: 'approved',
    requestStatus: 'open',
    createdAt: '2026-10-26 08:00',
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  },
  {
    id: 'M011',
    title: 'Máy tính bỏ túi Casio fx-570VN PLUS',
    category: 'dungcu',
    condition: 'Đã dùng còn tốt',
    description: 'Máy tính cầm tay còn phím bấm nảy, màn hình hiển thị tốt, pin mới thay đầu học kỳ, đã dán tem trường.',
    donorId: 'HS002',
    donorName: 'Lê Hoàng Nam (8/2)',
    availableSlots: ['T2_AM', 'T5_AM'],
    inputMethod: 'paper',
    status: 'pending', // Chờ duyệt
    requestStatus: 'closed',
    createdAt: '2026-10-27 07:15',
    image: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  },
  {
    id: 'M012',
    title: 'Bảng vẽ kỹ thuật A3 & Bộ thước dẹt học Công nghệ',
    category: 'dungcu',
    condition: 'Như mới',
    description: 'Bảng vẽ phục vụ môn Công nghệ lớp 8, góc kẹp giấy chắc chắn, tặng kèm 2 bút chì kim 2B.',
    donorId: 'HS001',
    donorName: 'Trần Bảo An (7/1)',
    availableSlots: ['T4_PM', 'T6_PM'],
    inputMethod: 'website',
    status: 'approved',
    requestStatus: 'open',
    createdAt: '2026-10-26 15:30',
    image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop&q=80',
    qualityCheck: null,
    storageSlot: null
  }
];

// Danh sách các yêu cầu nhận đồ (Requests)
export const INITIAL_REQUESTS = [
  {
    id: 'REQ-001',
    itemId: 'M001', // Sách Toán 7
    requesterId: 'HS002',
    requesterName: 'Lê Hoàng Nam',
    requesterClass: '8/2',
    reason: 'Em muốn mượn cho em họ ở quê chuẩn bị lên lớp 7 trường mình, gia đình em khó khăn.',
    availableSlots: ['T2_AM', 'T3_AM', 'T4_AM', 'T5_AM'],
    inputMethod: 'website',
    status: 'pending', // 'pending' (Chờ xét) | 'selected' (Đã chọn chính thức) | 'backup' (Dự phòng) | 'rejected'
    lotteryRank: null,
    createdAt: '2026-10-25 10:00'
  },
  {
    id: 'REQ-002',
    itemId: 'M001', // Sách Toán 7
    requesterId: 'HS003',
    requesterName: 'Nguyễn Thảo Nhi',
    requesterClass: '7/4',
    reason: 'Đầu năm em bị thất lạc sách Toán tập 1, rất mong được nhận bộ sách này để kịp ôn giữa kỳ.',
    availableSlots: ['T2_PM', 'T4_PM', 'T5_PM'],
    inputMethod: 'paper',
    status: 'pending',
    lotteryRank: null,
    createdAt: '2026-10-25 14:30'
  },
  {
    id: 'REQ-003',
    itemId: 'M006', // Bộ Compa & Eke (đã lưu ở trạm K1-A1)
    requesterId: 'HS002',
    requesterName: 'Lê Hoàng Nam',
    requesterClass: '8/2',
    reason: 'Chuẩn bị làm bài thi môn Hình học và tham gia thi KHKT cấp quận.',
    availableSlots: ['T3_AM', 'T5_AM'],
    inputMethod: 'website',
    status: 'selected', // Đã chọn
    lotteryRank: 1,
    createdAt: '2026-10-24 16:00'
  },
  {
    id: 'REQ-004',
    itemId: 'M008', // Balo chống nước (đang matching)
    requesterId: 'HS004',
    requesterName: 'Võ Minh Khang',
    requesterClass: '6/3',
    reason: 'Cặp của em bị rách khóa, cần cặp thay thế để đi học mùa mưa Đà Nẵng.',
    availableSlots: ['T3_PM', 'T4_PM'],
    inputMethod: 'website',
    status: 'selected',
    lotteryRank: 1,
    createdAt: '2026-10-23 09:00'
  },
  {
    id: 'REQ-005',
    itemId: 'M005', // Hộp bút (đã bàn giao hoàn tất)
    requesterId: 'HS002',
    requesterName: 'Lê Hoàng Nam',
    requesterClass: '8/2',
    reason: 'Cần dụng cụ để ghi chép bài học.',
    availableSlots: ['T2_PM'],
    inputMethod: 'website',
    status: 'selected',
    lotteryRank: 1,
    createdAt: '2026-10-20 10:15'
  }
];

// Lịch hẹn điều phối (Appointments)
export const INITIAL_APPOINTMENTS = [
  {
    id: 'APT-101',
    itemId: 'M006', // Compa
    requestId: 'REQ-003',
    donorId: 'HS001',
    requesterId: 'HS002',
    type: 'temporary_storage', // 'direct' | 'temporary_storage'
    donorSlot: 'T2_PM', // Thứ 2 Chiều đã gửi
    requesterSlot: 'T3_AM', // Thứ 3 Sáng sẽ nhận
    storageSlot: 'K1-A1',
    pickupCode: 'LOOP-7821', // Mã nhận đồ 8 ký tự
    status: 'ready_for_pickup', // 'scheduled' | 'donor_arrived' | 'ready_for_pickup' | 'completed' | 'cancelled'
    donorArrivedAt: '2026-10-27 14:15',
    pickedUpAt: null,
    notes: 'Đã kiểm tra chất lượng đạt loại A, cất tại ô K1-A1. Học sinh HS002 đến nhận vào sáng Thứ 3.'
  },
  {
    id: 'APT-102',
    itemId: 'M008', // Balo
    requestId: 'REQ-004',
    donorId: 'HS001',
    requesterId: 'HS004',
    type: 'direct', // Trao nhận trực tiếp cùng ca
    donorSlot: 'T3_PM',
    requesterSlot: 'T3_PM',
    storageSlot: null,
    pickupCode: 'LOOP-4912',
    status: 'scheduled',
    donorArrivedAt: null,
    pickedUpAt: null,
    notes: 'Hai bạn cùng rảnh ca Thứ 3 Chiều (14:00 - 14:45), hẹn gặp tại bàn trực trạm Lê Lợi.'
  },
  {
    id: 'APT-103',
    itemId: 'M005', // Hộp bút đã bàn giao
    requestId: 'REQ-005',
    donorId: 'HS001',
    requesterId: 'HS002',
    type: 'direct',
    donorSlot: 'T2_PM',
    requesterSlot: 'T2_PM',
    storageSlot: null,
    pickupCode: 'LOOP-3058',
    status: 'completed',
    donorArrivedAt: '2026-10-21 14:10',
    pickedUpAt: '2026-10-21 14:35',
    notes: 'Trao nhận hoàn tất thành công. Mã nhận đã được vô hiệu hóa.'
  }
];

// Nhật ký hệ thống (Audit Logs)
export const INITIAL_LOGS = [
  {
    id: 'LOG-001',
    timestamp: '2026-10-20 08:00:00',
    role: 'GV01 (Thầy Nguyễn Văn A)',
    action: 'KHỞI TẠO HỆ THỐNG',
    details: 'Khởi động trạm thử nghiệm KHKT Lê Lợi Loop – 10 ô kệ lưu trữ K1-A1 đến K1-B5.'
  },
  {
    id: 'LOG-002',
    timestamp: '2026-10-21 14:35:12',
    role: 'TR01 (CLB Tình nguyện)',
    action: 'BÀN GIAO THÀNH CÔNG',
    details: 'Bàn giao món M005 (Hộp bút) cho HS002 sau khi kiểm tra trùng khớp mã LOOP-3058.'
  },
  {
    id: 'LOG-003',
    timestamp: '2026-10-24 09:15:00',
    role: 'GV01 (Thầy Nguyễn Văn A)',
    action: 'DUYỆT BÀI ĐĂNG',
    details: 'Phê duyệt món M001 (Bộ Sách Toán 7) và M002 (Truyện Doraemon) đủ điều kiện đưa lên kho.'
  },
  {
    id: 'LOG-004',
    timestamp: '2026-10-26 14:20:45',
    role: 'HS002 (Lê Hoàng Nam)',
    action: 'ĐĂNG MÓN MỚI',
    details: 'Gửi yêu cầu đăng M004 (Sách Tiếng Anh 7 Global Success) qua Website – Chờ duyệt.'
  },
  {
    id: 'LOG-005',
    timestamp: '2026-10-27 14:15:30',
    role: 'TR01 (CLB Tình nguyện)',
    action: 'TIẾP NHẬN & KIỂM TRA TRẠM',
    details: 'Tiếp nhận M006 từ HS001, kiểm tra đạt chất lượng, cất tại ô K1-A1 chờ HS002 nhận.'
  }
];

// Danh sách thông báo trong hệ thống (Notifications)
export const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-001',
    recipientId: 'HS001', // Gửi đến Trần Bảo An
    senderId: 'HS002',
    senderName: 'Lê Hoàng Nam (8/2)',
    type: 'new_request',
    title: 'Yêu cầu nhận đồ mới!',
    message: 'Bạn Lê Hoàng Nam (8/2) vừa gửi yêu cầu xin nhận món "Bộ Sách Toán 7" của bạn.',
    itemId: 'M001',
    requestId: 'REQ-001',
    isRead: false,
    createdAt: '2026-10-25 10:00'
  },
  {
    id: 'NOTIF-002',
    recipientId: 'HS001',
    senderId: 'HS003',
    senderName: 'Nguyễn Thảo Nhi (7/4)',
    type: 'new_request',
    title: 'Yêu cầu nhận đồ mới!',
    message: 'Bạn Nguyễn Thảo Nhi (7/4) vừa gửi yêu cầu xin nhận món "Bộ Sách Toán 7" của bạn.',
    itemId: 'M001',
    requestId: 'REQ-002',
    isRead: false,
    createdAt: '2026-10-25 14:30'
  },
  {
    id: 'NOTIF-003',
    recipientId: 'HS002', // Gửi đến Lê Hoàng Nam
    senderId: 'HS001',
    senderName: 'Trần Bảo An (7/1)',
    type: 'request_accepted',
    title: 'Yêu cầu được chấp thuận! 🎉',
    message: 'Bạn Trần Bảo An đã đồng ý trao tặng món "Bộ Compa và Eke" cho bạn! Hãy kiểm tra lịch hẹn.',
    itemId: 'M006',
    requestId: 'REQ-003',
    isRead: false,
    createdAt: '2026-10-26 15:00'
  }
];


