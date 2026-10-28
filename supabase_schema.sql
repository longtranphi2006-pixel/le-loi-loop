-- =========================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU SUPABASE - DỰ ÁN KHKT: LÊ LỢI LOOP
-- Trường THCS Lê Lợi, TP. Đà Nẵng
-- Khẩu hiệu: "Đồ cũ trao tay – Giá trị ở lại"
-- =========================================================================

-- 1. BẢNG USERS (Học sinh, Giáo viên, Đội trực trạm)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    class TEXT,
    shift TEXT,
    avatar TEXT,
    phone TEXT,
    points INTEGER DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG ITEMS (Kho đồ dùng học tập, sách vở, đồng phục)
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    description TEXT,
    donor_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    donor_name TEXT,
    available_slots JSONB DEFAULT '[]'::jsonb,
    input_method TEXT DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'pending',
    request_status TEXT NOT NULL DEFAULT 'open',
    image TEXT,
    quality_check JSONB DEFAULT NULL,
    storage_slot TEXT DEFAULT NULL,
    reject_reason TEXT DEFAULT NULL,
    update_note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG REQUESTS (Danh sách yêu cầu nhận đồ từ học sinh)
CREATE TABLE IF NOT EXISTS public.requests (
    id TEXT PRIMARY KEY,
    item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
    requester_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    requester_name TEXT NOT NULL,
    requester_class TEXT,
    reason TEXT NOT NULL,
    available_slots JSONB DEFAULT '[]'::jsonb,
    input_method TEXT DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'pending',
    lottery_rank INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG APPOINTMENTS (Lịch hẹn điều phối ghép nối qua LoopMatch)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    item_id TEXT REFERENCES public.items(id) ON DELETE CASCADE,
    request_id TEXT REFERENCES public.requests(id) ON DELETE SET NULL,
    donor_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    requester_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'direct',
    donor_slot TEXT NOT NULL,
    requester_slot TEXT NOT NULL,
    storage_slot TEXT DEFAULT NULL,
    pickup_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'scheduled',
    donor_arrived_at TIMESTAMPTZ DEFAULT NULL,
    picked_up_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG LOGS (Nhật ký kiểm toán hệ thống KHKT)
CREATE TABLE IF NOT EXISTS public.logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- BẬT ROW LEVEL SECURITY (RLS) & XÓA POLICY CŨ NẾU ĐÃ TỒN TẠI (TRÁNH LỖI DUPLICATE)
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Allow public read users" ON public.users;
DROP POLICY IF EXISTS "Allow public insert users" ON public.users;
DROP POLICY IF EXISTS "Allow public update users" ON public.users;

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true);

-- Items policies
DROP POLICY IF EXISTS "Allow public read items" ON public.items;
DROP POLICY IF EXISTS "Allow public insert items" ON public.items;
DROP POLICY IF EXISTS "Allow public update items" ON public.items;
DROP POLICY IF EXISTS "Allow public delete items" ON public.items;

CREATE POLICY "Allow public read items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Allow public insert items" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update items" ON public.items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete items" ON public.items FOR DELETE USING (true);

-- Requests policies
DROP POLICY IF EXISTS "Allow public read requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public insert requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public update requests" ON public.requests;
DROP POLICY IF EXISTS "Allow public delete requests" ON public.requests;

CREATE POLICY "Allow public read requests" ON public.requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert requests" ON public.requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update requests" ON public.requests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete requests" ON public.requests FOR DELETE USING (true);

-- Appointments policies
DROP POLICY IF EXISTS "Allow public read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update appointments" ON public.appointments;

CREATE POLICY "Allow public read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update appointments" ON public.appointments FOR UPDATE USING (true);

-- Logs policies
DROP POLICY IF EXISTS "Allow public read logs" ON public.logs;
DROP POLICY IF EXISTS "Allow public insert logs" ON public.logs;

CREATE POLICY "Allow public read logs" ON public.logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert logs" ON public.logs FOR INSERT WITH CHECK (true);

-- =========================================================================
-- BẬT TÍNH NĂNG REALTIME AN TOÀN (KHÔNG BÁO LỖI NẾU ĐÃ BẬT TRƯỚC ĐÓ)
-- =========================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- =========================================================================
-- DỮ LIỆU BAN ĐẦU (SEED DATA MẪU)
-- =========================================================================
INSERT INTO public.users (id, name, role, class, shift, avatar, phone, points, bio)
VALUES
('HS001', 'Trần Bảo An', 'student', '7/1', 'Sáng', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '0905.123.456', 15, 'Học sinh lớp 7/1 – Đam mê đọc sách và chia sẻ đồ dùng cũ'),
('HS002', 'Lê Hoàng Nam', 'student', '8/2', 'Chiều', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', '0914.789.012', 20, 'Học sinh lớp 8/2 – Yêu thích KHKT và hoạt động xanh'),
('TR01', 'CLB Tình nguyện Lê Lợi (Đội trực trạm)', 'station_staff', 'Đội Tình Nguyện THCS Lê Lợi', 'Cả ngày (Theo ca trực)', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80', 'Phòng Đội KHKT', 120, 'Tổ xung kích kiểm tra chất lượng đồ dùng và điều phối trao nhận'),
('GV01', 'Thầy Nguyễn Văn A', 'teacher', 'Giáo viên phụ trách KHKT', 'Toàn thời gian', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Văn phòng Đoàn Đội', 250, 'Giáo viên hướng dẫn đề tài KHKT "Lê Lợi Loop"')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.items (id, title, category, condition, description, donor_id, donor_name, available_slots, input_method, status, request_status, image, quality_check, storage_slot)
VALUES
('M001', 'Bộ Sách Toán 7 (Bộ Chân trời sáng tạo)', 'sgk', 'Tốt', 'Trọn bộ 2 tập Toán 7 Chân trời sáng tạo, có bọc bìa nilon cẩn thận, không rách trang hay vẽ bậy.', 'HS001', 'Trần Bảo An (7/1)', '["T2_PM", "T3_PM", "T4_PM"]'::jsonb, 'website', 'approved', 'open', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80', '{"passed": true, "note": "Bìa đẹp, đầy đủ trang, không rách", "checkedBy": "TR01"}'::jsonb, NULL),
('M002', 'Bộ truyện Doraemon ngắn (10 cuốn tuyển chọn)', 'truyen', 'Đã dùng còn tốt', '10 tập truyện tranh Doraemon Kim Đồng, giải trí lành mạnh sau giờ học căng thẳng.', 'HS001', 'Trần Bảo An (7/1)', '["T3_PM", "T5_PM"]'::jsonb, 'website', 'approved', 'open', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80', NULL, NULL),
('M003', 'Cặp học sinh màu đen chống gù lưng', 'cap', 'Đã dùng còn tốt', 'Cặp màu đen quai đệm êm, khóa kéo trơn tru, nhiều ngăn đựng sách vở và bình nước.', 'HS002', 'Lê Hoàng Nam (8/2)', '["T2_AM", "T4_AM", "T6_AM"]'::jsonb, 'paper', 'approved', 'open', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80', NULL, NULL),
('M004', 'Sách Tiếng Anh 7 Global Success (Tập 1 & 2)', 'sgk', 'Tốt', 'Sách giáo khoa Tiếng Anh 7 chương trình mới, chữ in rõ nét.', 'HS002', 'Lê Hoàng Nam (8/2)', '["T3_AM", "T5_AM"]'::jsonb, 'website', 'pending', 'closed', 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80', NULL, NULL),
('M005', 'Hộp bút nhiều ngăn kèm bộ thước kẻ Deli', 'dungcu', 'Đã dùng còn tốt', 'Hộp bút vải Canvas bền bỉ, kèm eke, thước thẳng 20cm và thước đo độ.', 'HS001', 'Trần Bảo An (7/1)', '["T2_PM"]'::jsonb, 'website', 'completed', 'closed', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=80', '{"passed": true, "note": "Khóa tốt, thước không sứt mẻ", "checkedBy": "GV01"}'::jsonb, NULL),
('M006', 'Bộ Compa và Eke vẽ kỹ thuật KHKT', 'dungcu', 'Như mới', 'Hộp compa kim loại chuyên dụng kèm ngòi chì thay thế, eke góc chuẩn.', 'HS001', 'Trần Bảo An (7/1)', '["T2_PM", "T4_PM"]'::jsonb, 'website', 'stored', 'closed', 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=500&auto=format&fit=crop&q=80', '{"passed": true, "note": "Đạt kiểm tra thực tế, ngòi tốt", "checkedBy": "TR01"}'::jsonb, 'K1-A1'),
('M007', 'Vở bài tập Ngữ văn 8 tập 1 (Chân trời sáng tạo)', 'stk', 'Như mới', 'Sách bài tập mới 99%, chưa viết chữ nào do mua thừa đầu năm học.', 'HS002', 'Lê Hoàng Nam (8/2)', '["T3_AM", "T4_AM", "T5_AM"]'::jsonb, 'website', 'approved', 'open', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=80', NULL, NULL),
('M008', 'Balo chống nước thời trang học sinh', 'cap', 'Đã dùng còn tốt', 'Balo màu xanh than, vải dù trượt nước, khóa số an toàn.', 'HS001', 'Trần Bảo An (7/1)', '["T2_PM", "T3_PM"]'::jsonb, 'paper', 'matching', 'closed', 'https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=500&auto=format&fit=crop&q=80', NULL, NULL),
('M009', 'Áo khoác đồng phục THCS Lê Lợi (Size M)', 'dongphuc', 'Tốt', 'Áo khoác gió mùa đông logo trường THCS Lê Lợi, khóa kéo tốt, vừa vặn bạn nặng 42-50kg.', 'HS002', 'Lê Hoàng Nam (8/2)', '["T4_AM", "T6_AM"]'::jsonb, 'website', 'approved', 'open', 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=500&auto=format&fit=crop&q=80', NULL, NULL),
('M010', 'Từ điển Anh - Việt 55.000 từ bỏ túi', 'stk', 'Như mới', 'Cuốn từ điển tra cứu nhanh cho môn Ngoại ngữ, bìa da dẻo bền bỉ.', 'HS001', 'Trần Bảo An (7/1)', '["T3_PM", "T5_PM"]'::jsonb, 'website', 'approved', 'open', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500&auto=format&fit=crop&q=80', NULL, NULL),
('M011', 'Máy tính bỏ túi Casio fx-570VN PLUS', 'dungcu', 'Đã dùng còn tốt', 'Máy tính cầm tay còn phím bấm nảy, màn hình hiển thị tốt, pin mới thay.', 'HS002', 'Lê Hoàng Nam (8/2)', '["T2_AM", "T5_AM"]'::jsonb, 'paper', 'pending', 'closed', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=500&auto=format&fit=crop&q=80', NULL, NULL),
('M012', 'Bảng vẽ kỹ thuật A3 & Bộ thước dẹt học Công nghệ', 'dungcu', 'Như mới', 'Bảng vẽ phục vụ môn Công nghệ lớp 8, kèm bút chì kim.', 'HS001', 'Trần Bảo An (7/1)', '["T4_PM", "T6_PM"]'::jsonb, 'website', 'approved', 'open', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500&auto=format&fit=crop&q=80', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.requests (id, item_id, requester_id, requester_name, requester_class, reason, available_slots, input_method, status, lottery_rank)
VALUES
('REQ-001', 'M001', 'HS002', 'Lê Hoàng Nam', '8/2', 'Em muốn mượn cho em họ ở quê chuẩn bị lên lớp 7 trường mình.', '["T2_AM", "T3_AM", "T4_AM", "T5_AM"]'::jsonb, 'website', 'pending', NULL),
('REQ-002', 'M001', 'HS001', 'Nguyễn Thảo Nhi', '7/4', 'Đầu năm em bị thất lạc sách Toán tập 1, rất mong được nhận bộ sách này.', '["T2_PM", "T4_PM", "T5_PM"]'::jsonb, 'paper', 'pending', NULL),
('REQ-003', 'M006', 'HS002', 'Lê Hoàng Nam', '8/2', 'Chuẩn bị làm bài thi môn Hình học và tham gia thi KHKT.', '["T3_AM", "T5_AM"]'::jsonb, 'website', 'selected', 1),
('REQ-004', 'M008', 'HS002', 'Võ Minh Khang', '6/3', 'Cặp của em bị rách khóa, cần cặp thay thế để đi học mùa mưa Đà Nẵng.', '["T3_PM", "T4_PM"]'::jsonb, 'website', 'selected', 1),
('REQ-005', 'M005', 'HS002', 'Lê Hoàng Nam', '8/2', 'Cần dụng cụ để ghi chép bài học.', '["T2_PM"]'::jsonb, 'website', 'selected', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.appointments (id, item_id, request_id, donor_id, requester_id, type, donor_slot, requester_slot, storage_slot, pickup_code, status, donor_arrived_at, picked_up_at, notes)
VALUES
('APT-101', 'M006', 'REQ-003', 'HS001', 'HS002', 'temporary_storage', 'T2_PM', 'T3_AM', 'K1-A1', 'LOOP-7821', 'ready_for_pickup', NOW() - INTERVAL '1 day', NULL, 'Đã kiểm tra chất lượng đạt loại A, cất tại ô K1-A1. Học sinh HS002 đến nhận vào sáng Thứ 3.'),
('APT-102', 'M008', 'REQ-004', 'HS001', 'HS002', 'direct', 'T3_PM', 'T3_PM', NULL, 'LOOP-4912', 'scheduled', NULL, NULL, 'Hai bạn cùng rảnh ca Thứ 3 Chiều (14:00 - 14:45), hẹn gặp tại bàn trực trạm Lê Lợi.'),
('APT-103', 'M005', 'REQ-005', 'HS001', 'HS002', 'direct', 'T2_PM', 'T2_PM', NULL, 'LOOP-3058', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '30 minutes', 'Trao nhận hoàn tất thành công. Mã nhận đã được vô hiệu hóa.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.logs (id, timestamp, role, action, details)
VALUES
('LOG-001', NOW() - INTERVAL '7 days', 'GV01 (Thầy Nguyễn Văn A)', 'KHỞI TẠO HỆ THỐNG', 'Khởi động trạm thử nghiệm KHKT Lê Lợi Loop – 10 ô kệ lưu trữ K1-A1 đến K1-B5.'),
('LOG-002', NOW() - INTERVAL '5 days', 'TR01 (CLB Tình nguyện)', 'BÀN GIAO THÀNH CÔNG', 'Bàn giao món M005 (Hộp bút) cho HS002 sau khi kiểm tra trùng khớp mã LOOP-3058.'),
('LOG-003', NOW() - INTERVAL '3 days', 'GV01 (Thầy Nguyễn Văn A)', 'DUYỆT BÀI ĐĂNG', 'Phê duyệt món M001 (Bộ Sách Toán 7) và M002 (Truyện Doraemon) đủ điều kiện đưa lên kho.'),
('LOG-004', NOW() - INTERVAL '1 day', 'HS002 (Lê Hoàng Nam)', 'ĐĂNG MÓN MỚI', 'Gửi yêu cầu đăng M004 (Sách Tiếng Anh 7 Global Success) qua Website – Chờ duyệt.'),
('LOG-005', NOW() - INTERVAL '4 hours', 'TR01 (CLB Tình nguyện)', 'TIẾP NHẬN & KIỂM TRA TRẠM', 'Tiếp nhận M006 từ HS001, kiểm tra đạt chất lượng, cất tại ô K1-A1 chờ HS002 nhận.')
ON CONFLICT (id) DO NOTHING;
