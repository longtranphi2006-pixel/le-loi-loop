-- =========================================================================
-- FILE: 003_add_station_storage.sql
-- MỤC ĐÍCH: Bổ sung 2 bảng chuyên trách quản lý 10 ô kệ tại Trạm Phòng Đội THCS Lê Lợi
-- =========================================================================
-- Giả định (Assumptions): Trạm Phòng Đội có 10 ô kệ lưu trữ K1-A1 đến K1-B5.
-- Điều kiện tiên quyết (Preconditions): Bảng users, items, appointments đã có trên DB.
-- Rủi ro (Risk Level): THẤP (P2) - Thêm bảng mới, không chỉnh sửa bảng cũ.
-- Chiến lược Rollback (Rollback Strategy):
--   DROP TABLE IF EXISTS public.storage_assignments;
--   DROP TABLE IF EXISTS public.station_slots;
-- Trạng thái: READY TO RUN
-- =========================================================================

-- BƯỚC 1: TẠO BẢNG STATION_SLOTS (10 Ô KỆ LƯU TRỮ PHÒNG ĐỘI)
CREATE TABLE IF NOT EXISTS public.station_slots (
    id TEXT PRIMARY KEY,                       -- 'K1-A1', 'K1-A2', ..., 'K1-B5'
    shelf_zone TEXT NOT NULL,                  -- 'Khu A' (Ngăn trên), 'Khu B' (Ngăn dưới)
    slot_number INTEGER NOT NULL,              -- 1, 2, 3, 4, 5
    max_dimensions TEXT DEFAULT '30x40x25 cm', -- Kích thước phù hợp cặp/sách
    status TEXT NOT NULL DEFAULT 'active',     -- 'active', 'maintenance'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BƯỚC 2: KHỞI TẠO 10 Ô KỆ MẪU (THEO THIẾT KẾ PHÒNG ĐỘI)
INSERT INTO public.station_slots (id, shelf_zone, slot_number, max_dimensions)
VALUES
('K1-A1', 'Khu A (Ngăn trên)', 1, '30x40x25 cm'),
('K1-A2', 'Khu A (Ngăn trên)', 2, '30x40x25 cm'),
('K1-A3', 'Khu A (Ngăn trên)', 3, '30x40x25 cm'),
('K1-A4', 'Khu A (Ngăn trên)', 4, '30x40x25 cm'),
('K1-A5', 'Khu A (Ngăn trên)', 5, '30x40x25 cm'),
('K1-B1', 'Khu B (Ngăn dưới)', 1, '35x45x30 cm'),
('K1-B2', 'Khu B (Ngăn dưới)', 2, '35x45x30 cm'),
('K1-B3', 'Khu B (Ngăn dưới)', 3, '35x45x30 cm'),
('K1-B4', 'Khu B (Ngăn dưới)', 4, '35x45x30 cm'),
('K1-B5', 'Khu B (Ngăn dưới)', 5, '35x45x30 cm')
ON CONFLICT (id) DO NOTHING;

-- BƯỚC 3: TẠO BẢNG STORAGE_ASSIGNMENTS (LỊCH SỬ LƯU VẾT GÁN Ô KỆ TRẠM)
CREATE TABLE IF NOT EXISTS public.storage_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    slot_id TEXT NOT NULL REFERENCES public.station_slots(id) ON DELETE RESTRICT,
    item_id TEXT NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
    appointment_id TEXT REFERENCES public.appointments(id) ON DELETE SET NULL,
    assigned_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'occupied', -- 'occupied' (đang chứa), 'released' (đã giải phóng)
    occupied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    notes TEXT
);

-- BƯỚC 4: RÀNG BUỘC CHỈ 1 MÓN ĐỒ CHIẾM GIỮ Ô KỆ TẠI 1 THỜI ĐIỂM
CREATE UNIQUE INDEX IF NOT EXISTS uq_storage_active_slot 
ON public.storage_assignments(slot_id) 
WHERE status = 'occupied';

-- BƯỚC 5: KÍCH HOẠT RLS CHO 2 BẢNG MỚI
ALTER TABLE public.station_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view station_slots" ON public.station_slots;
CREATE POLICY "Public can view station_slots" ON public.station_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view storage_assignments" ON public.storage_assignments;
CREATE POLICY "Public can view storage_assignments" ON public.storage_assignments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow staff update storage_assignments" ON public.storage_assignments;
CREATE POLICY "Allow staff update storage_assignments" ON public.storage_assignments
FOR ALL USING (
    auth.role() = 'service_role'
    OR (SELECT user_role FROM public.get_current_profile()) IN ('station_staff', 'teacher', 'admin')
) WITH CHECK (
    auth.role() = 'service_role'
    OR (SELECT user_role FROM public.get_current_profile()) IN ('station_staff', 'teacher', 'admin')
);

-- =========================================================================
-- TRUY VẤN KIỂM CHỨNG KẾT QUẢ SAU KHI CHẠY (VERIFICATION QUERY)
-- =========================================================================
-- Kiểm tra đủ 10 ô kệ:
SELECT id, shelf_zone, slot_number, status FROM public.station_slots ORDER BY id;

