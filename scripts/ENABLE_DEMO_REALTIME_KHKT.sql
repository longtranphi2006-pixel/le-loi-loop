-- =========================================================================
-- FILE: scripts/ENABLE_DEMO_REALTIME_KHKT.sql
-- DỰ ÁN: LÊ LỢI LOOP — "ĐỒ CŨ TRAO TAY, GIÁ TRỊ Ở LẠI"
-- ĐỀ TÀI KHKT: THCS LÊ LỢI, THÀNH PHỐ ĐÀ NẴNG
-- MÔI TRƯỜNG THỰC THI: Supabase Dashboard -> SQL Editor (Project: ynkhukeqdqewakrqtvtu)
-- MỤC ĐÍCH: MỞ QUYỀN RLS & BẬT SUPABASE REALTIME ĐỂ GIÁM KHẢO DÙNG ĐIỆN THOẠI
--           TƯƠNG TÁC THỜI GIAN THỰC VỚI LAPTOP MÀ KHÔNG BỊ CHẶN BỞI RLS
-- =========================================================================

-- 1. ĐẢM BẢO 4 HỒ SƠ CỐT LÕI TỒN TẠI TRONG BẢNG users (TRÁNH LỖI FOREIGN KEY)
INSERT INTO public.users (id, name, role, class, shift, avatar, phone, points, bio)
VALUES
(
    'HS001', 'Trần Bảo An', 'student', '7/1', 'Sáng',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    '0905123456', 15, 'Học sinh tham gia vận hành thử nghiệm dự án Lê Lợi Loop'
),
(
    'HS002', 'Lê Hoàng Nam', 'student', '8/2', 'Chiều',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
    '0905654321', 10, 'Học sinh tham gia vận hành thử nghiệm dự án Lê Lợi Loop'
),
(
    'TR01', 'Đội Trực Trạm Phòng Đội', 'station_staff', 'CLB Đội', 'Cả ngày',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    '0905999888', 50, 'Bộ phận quản sinh trạm lưu giữ Phòng Đoàn Đội'
),
(
    'GV01', 'Thầy Nguyễn Văn A', 'teacher', 'Hội đồng KHKT', 'Cả ngày',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    '0905000111', 100, 'Giáo viên phụ trách hướng dẫn nghiên cứu KHKT'
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    role = EXCLUDED.role, 
    class = EXCLUDED.class, 
    shift = EXCLUDED.shift;

-- 2. CẤU HÌNH RLS MỞ RỘNG (PERMISSIVE DEMO POLICIES CHO ANON & AUTHENTICATED)
-- Cho phép đọc, ghi, sửa, xóa trên các bảng nghiệp vụ chính để thiết bị của Giám khảo ghi trực tiếp lên Supabase Cloud

-- Bảng items:
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Demo full access items" ON public.items;
CREATE POLICY "Demo full access items" ON public.items
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Bảng requests:
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Demo full access requests" ON public.requests;
CREATE POLICY "Demo full access requests" ON public.requests
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Bảng appointments:
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Demo full access appointments" ON public.appointments;
CREATE POLICY "Demo full access appointments" ON public.appointments
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Bảng logs:
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Demo full access logs" ON public.logs;
CREATE POLICY "Demo full access logs" ON public.logs
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Bảng notifications:
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Demo full access notifications" ON public.notifications;
CREATE POLICY "Demo full access notifications" ON public.notifications
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Bảng users (cho phép đọc danh bạ):
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Demo full access users" ON public.users;
CREATE POLICY "Demo full access users" ON public.users
    FOR ALL TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. KÍCH HOẠT SUPABASE REALTIME ĐỂ PHÁT SỰ KIỆN POSTGRES_CHANGES XUYÊN THIẾT BỊ
DO $$
BEGIN
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

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 4. BẬT REPLICA IDENTITY FULL ĐỂ REALTIME BẮT ĐỦ DỮ LIỆU OLD VÀ NEW
ALTER TABLE public.items REPLICA IDENTITY FULL;
ALTER TABLE public.requests REPLICA IDENTITY FULL;
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 5. CẤU HÌNH BUCKET SUPABASE STORAGE "item-images" (NẾU DÙNG STORAGE)
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public access to item images" ON storage.objects;
CREATE POLICY "Public access to item images" ON storage.objects
    FOR ALL TO anon, authenticated
    USING (bucket_id = 'item-images')
    WITH CHECK (bucket_id = 'item-images');

-- THÔNG BÁO HOÀN TẤT:
SELECT 'THÀNH CÔNG: Đã mở quyền RLS và kích hoạt Supabase Realtime cho buổi trình diễn KHKT Lê Lợi Loop!' AS thong_bao;
