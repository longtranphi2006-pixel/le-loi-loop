-- =========================================================================
-- FILE: 002_add_notifications.sql
-- MỤC ĐÍCH: Bổ sung bảng notifications cho hệ thống chuông thông báo Cloud đa thiết bị
-- =========================================================================
-- Giả định (Assumptions): Bảng users, items, requests đã tồn tại; pgcrypto extension khả dụng.
-- Điều kiện tiên quyết (Preconditions): 001_preflight_checks.sql đã chạy và không có orphan FK.
-- Rủi ro (Risk Level): THẤP (P2) - Chỉ tạo bảng mới, không ảnh hưởng dữ liệu đang chạy.
-- Chiến lược Rollback (Rollback Strategy):
--   ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.notifications;
--   DROP TABLE IF EXISTS public.notifications;
-- Trạng thái: READY TO RUN
-- =========================================================================

-- BƯỚC 1: KÍCH HOẠT EXTENSION PGCRYPTO CHO HÀM GEN_RANDOM_UUID()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- BƯỚC 2: TẠO BẢNG NOTIFICATIONS NẾU CHƯA CÓ
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    recipient_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    type TEXT NOT NULL DEFAULT 'info', -- 'new_request', 'request_accepted', 'item_ready', 'item_approved'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
    request_id TEXT REFERENCES public.requests(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BƯỚC 3: TẠO CHỈ MỤC TĂNG TỐC TRUY VẤN THÔNG BÁO CHƯA ĐỌC
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
ON public.notifications(recipient_id, is_read, created_at DESC);

-- BƯỚC 4: KÍCH HOẠT REALTIME PUBLICATION CHO BẢNG NOTIFICATIONS
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- BƯỚC 5: KÍCH HOẠT RLS (CHÍNH SÁCH BẢO VỆ CHỈ NGƯỜI NHẬN ĐƯỢC XEM VÀ SỬA)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
FOR SELECT USING (
    -- Chỉ cho phép người nhận đọc thông báo của chính mình, hoặc service_role
    auth.uid() IS NOT NULL AND (
        recipient_id = auth.uid()::text 
        OR recipient_id = (SELECT legacy_id FROM public.get_current_profile())
        OR auth.role() = 'service_role'
        OR (SELECT user_role FROM public.get_current_profile()) IN ('teacher', 'admin', 'station_staff')
    )
);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
        recipient_id = auth.uid()::text 
        OR recipient_id = (SELECT legacy_id FROM public.get_current_profile())
    )
) WITH CHECK (
    auth.uid() IS NOT NULL AND (
        recipient_id = auth.uid()::text 
        OR recipient_id = (SELECT legacy_id FROM public.get_current_profile())
    )
);

-- CHẶN TÙY TIỆN INSERT: Chỉ cho phép người dùng đăng nhập tạo thông báo, hoặc sinh tự động qua RPC
DROP POLICY IF EXISTS "Allow insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL 
    OR auth.role() = 'service_role'
);

-- =========================================================================
-- TRUY VẤN KIỂM CHỨNG KẾT QUẢ SAU KHI CHẠY (VERIFICATION QUERY)
-- =========================================================================
-- Chạy câu lệnh này sau khi bấm Run:
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

