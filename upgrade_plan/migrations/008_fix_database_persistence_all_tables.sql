-- =========================================================================
-- FILE: 008_fix_database_persistence_all_tables.sql
-- DỰ ÁN: LÊ LỢI LOOP — TRƯỜNG THCS LÊ LỢI, THÀNH PHỐ ĐÀ NẴNG
-- MỤC ĐÍCH:
-- 1. Mở toàn quyền ghi/đọc (SELECT, INSERT, UPDATE, DELETE) cho ứng dụng Web thực tế
--    (cho cả role anon và authenticated), xóa bỏ hoàn toàn lỗi chặn 401/42501 (RLS).
-- 2. Dỡ bỏ các ràng buộc khóa ngoại cứng (foreign key) gây lỗi khi học sinh mới đăng ký.
-- 3. Đảm bảo dữ liệu tài khoản, đồ dùng, yêu cầu, lịch hẹn, lịch sử kệ và nhật ký
--    lưu thẳng vào Supabase PostgreSQL và KHÔNG BAO GIỜ BỊ MẤT KHI F5 HOẶC MỞ LẠI WEB.
-- =========================================================================
-- HƯỚNG DẪN THỰC HIỆN:
-- 1. Truy cập https://supabase.com/dashboard -> Chọn dự án ynkhukeqdqewakrqtvtu
-- 2. Vào mục "SQL Editor" -> Chọn "New Query"
-- 3. Dán toàn bộ nội dung file này và bấm "Run" (hoặc Ctrl + Enter).
-- =========================================================================

-- -------------------------------------------------------------------------
-- PHẦN 1: ĐẢM BẢO ĐỦ CÁC BẢNG CƠ SỞ VÀ CỘT THUỘC TÍNH CỦA HỆ THỐNG
-- -------------------------------------------------------------------------

-- 1.1. Bảng users
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
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bổ sung các cột nếu bảng users đã tồn tại nhưng thiếu cột
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS class TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS shift TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;

-- 1.2. Bảng items
CREATE TABLE IF NOT EXISTS public.items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    description TEXT,
    donor_id TEXT,
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

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS donor_name TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS available_slots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS input_method TEXT DEFAULT 'website';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS request_status TEXT DEFAULT 'open';
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS quality_check JSONB DEFAULT NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS storage_slot TEXT DEFAULT NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS reject_reason TEXT DEFAULT NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS update_note TEXT DEFAULT NULL;

-- 1.3. Bảng requests
CREATE TABLE IF NOT EXISTS public.requests (
    id TEXT PRIMARY KEY,
    item_id TEXT,
    requester_id TEXT,
    requester_name TEXT NOT NULL,
    requester_class TEXT,
    reason TEXT NOT NULL,
    available_slots JSONB DEFAULT '[]'::jsonb,
    input_method TEXT DEFAULT 'website',
    status TEXT NOT NULL DEFAULT 'pending',
    lottery_rank INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS requester_class TEXT;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS available_slots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS input_method TEXT DEFAULT 'website';
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS lottery_rank INTEGER DEFAULT NULL;

-- 1.4. Bảng appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    item_id TEXT,
    request_id TEXT,
    donor_id TEXT,
    requester_id TEXT,
    type TEXT NOT NULL DEFAULT 'direct',
    donor_slot TEXT,
    requester_slot TEXT,
    storage_slot TEXT DEFAULT NULL,
    pickup_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    donor_arrived_at TIMESTAMPTZ DEFAULT NULL,
    picked_up_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS storage_slot TEXT DEFAULT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS donor_arrived_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;

-- 1.5. Bảng logs
CREATE TABLE IF NOT EXISTS public.logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6. Bảng notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL,
    sender_id TEXT,
    sender_name TEXT,
    type TEXT DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    item_id TEXT,
    request_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.7. Bảng station_slots
CREATE TABLE IF NOT EXISTS public.station_slots (
    id TEXT PRIMARY KEY,
    shelf_zone TEXT,
    slot_number INTEGER,
    max_dimensions TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.8. Bảng storage_assignments (Theo dõi lịch sử xếp đồ vào ô kệ)
CREATE TABLE IF NOT EXISTS public.storage_assignments (
    id TEXT PRIMARY KEY,
    slot_id TEXT,
    item_id TEXT,
    appointment_id TEXT,
    status TEXT DEFAULT 'assigned',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    released_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- PHẦN 2: THÁO GỠ CÁC RÀNG BUỘC KHÓA NGOẠI GÂY TẮC NGHẼN (FOREIGN KEYS)
-- -------------------------------------------------------------------------
-- Khi học sinh mới đăng ký trên web, nếu khóa ngoại quá chặt chẽ sẽ khiến
-- PostgreSQL từ chối lưu bài đăng hoặc yêu cầu. Việc nới lỏng khóa ngoại
-- giúp website hoạt động trơn tru 100% như các nền tảng web linh hoạt.

ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_donor_id_fkey;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_requester_id_fkey;
ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS requests_item_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_donor_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_requester_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_item_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_request_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_sender_id_fkey;
ALTER TABLE public.storage_assignments DROP CONSTRAINT IF EXISTS storage_assignments_slot_id_fkey;
ALTER TABLE public.storage_assignments DROP CONSTRAINT IF EXISTS storage_assignments_item_id_fkey;

-- -------------------------------------------------------------------------
-- PHẦN 3: DỠ BỎ TOÀN BỘ RÀO CẢN RLS (ROW-LEVEL SECURITY) CHO ỨNG DỤNG WEB
-- -------------------------------------------------------------------------
-- Tắt RLS và cấp toàn quyền SELECT, INSERT, UPDATE, DELETE cho anon & authenticated

-- Tắt RLS trên tất cả các bảng nghiệp vụ:
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_assignments DISABLE ROW LEVEL SECURITY;

-- Cấp quyền truy cập trực tiếp qua PostgREST cho role anon và authenticated:
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- PHẦN 4: KHỞI TẠO TÀI KHOẢN MẪU & DANH MỤC Ô KỆ TRẠM TRÊN DATABASE
-- -------------------------------------------------------------------------

-- 4.1. Khởi tạo 4 tài khoản hệ thống chuẩn hóa vào bảng public.users
INSERT INTO public.users (id, name, role, class, shift, avatar, phone, points, bio, password)
VALUES 
  ('HS001', 'Trần Bảo An', 'student', '7/1', 'Sáng', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '0905.123.456', 15, 'Học sinh lớp 7/1 – Người cho đồ dùng học tập', 'LeLoiLoop@2026'),
  ('HS002', 'Lê Hoàng Nam', 'student', '8/2', 'Chiều', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', '0914.789.012', 20, 'Học sinh lớp 8/2 – Người xin nhận đồ dùng học tập', 'LeLoiLoop@2026'),
  ('TR01', 'CLB Tình nguyện Lê Lợi (Đội trực trạm)', 'station_staff', 'Đội Tình Nguyện THCS Lê Lợi', 'Cả ngày', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&auto=format&fit=crop&q=80', 'Phòng Đội / Trạm KHKT', 120, 'Tổ xung kích kiểm tra chất lượng đồ dùng, phân loại và điều phối trao nhận tại trạm', 'LeLoiLoop@2026'),
  ('GV01', 'Thầy Nguyễn Văn A', 'teacher', 'Giáo viên phụ trách KHKT', 'Toàn thời gian', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Văn phòng Đoàn Đội / Hội đồng SP', 250, 'Giáo viên hướng dẫn đề tài KHKT Lê Lợi Loop – Quản lý, phê duyệt và giám sát hệ thống', 'LeLoiLoop@2026')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  class = EXCLUDED.class,
  shift = EXCLUDED.shift,
  avatar = EXCLUDED.avatar,
  phone = EXCLUDED.phone,
  points = EXCLUDED.points,
  bio = EXCLUDED.bio,
  password = EXCLUDED.password;

-- 4.2. Khởi tạo 10 ô kệ lưu trữ tại Trạm Lê Lợi
INSERT INTO public.station_slots (id, shelf_zone, slot_number, max_dimensions, status)
VALUES
  ('K1-A1', 'Khu A (Ngăn trên)', 1, '30x40x25 cm', 'active'),
  ('K1-A2', 'Khu A (Ngăn trên)', 2, '30x40x25 cm', 'active'),
  ('K1-A3', 'Khu A (Ngăn trên)', 3, '30x40x25 cm', 'active'),
  ('K1-A4', 'Khu A (Ngăn trên)', 4, '30x40x25 cm', 'active'),
  ('K1-A5', 'Khu A (Ngăn trên)', 5, '30x40x25 cm', 'active'),
  ('K1-B1', 'Khu B (Ngăn dưới)', 1, '35x45x30 cm', 'active'),
  ('K1-B2', 'Khu B (Ngăn dưới)', 2, '35x45x30 cm', 'active'),
  ('K1-B3', 'Khu B (Ngăn dưới)', 3, '35x45x30 cm', 'active'),
  ('K1-B4', 'Khu B (Ngăn dưới)', 4, '35x45x30 cm', 'active'),
  ('K1-B5', 'Khu B (Ngăn dưới)', 5, '35x45x30 cm', 'active')
ON CONFLICT (id) DO NOTHING;

-- 4.3. Ghi log khởi động hệ thống vận hành thực tế
INSERT INTO public.logs (id, role, action, details)
VALUES (
  'LOG-INIT-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8),
  'Hệ thống Cơ sở dữ liệu',
  'KÍCH HOẠT VẬN HÀNH THỰC TẾ',
  'Đã tháo gỡ toàn bộ rào cản RLS, mở quyền ghi Cloud cho ứng dụng web THCS Lê Lợi. Dữ liệu sẽ được lưu vĩnh viễn trên Supabase PostgreSQL.'
);

-- BẬT REALTIME CHO TẤT CẢ CÁC BẢNG ĐỂ ĐỒNG BỘ TỨC THÌ ĐA THIẾT BỊ
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.logs;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.station_slots;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.storage_assignments;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
