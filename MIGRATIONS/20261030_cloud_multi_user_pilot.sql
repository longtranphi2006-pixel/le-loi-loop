-- =========================================================================
-- MIGRATION: 20261030_cloud_multi_user_pilot.sql
-- DỰ ÁN: LÊ LỢI LOOP - PILOT CLOUD ĐA NGƯỜI DÙNG (THCS LÊ LỢI)
-- =========================================================================
-- QUY TẮC AN TOÀN:
-- 1. FILE NÀY DÙNG ĐỂ REVIEW VÀ ĐỀ XUẤT CHO KẾ HOẠCH NÂNG CẤP CLOUD.
-- 2. KHÔNG TỰ ĐỘNG CHẠY TRÊN PRODUCTION NẾU CHƯA CÓ PHÊ DUYỆT CỦA QUẢN TRỊ VIÊN.
-- 3. ĐÃ ĐƯỢC THIẾT KẾ IDEMPOTENT (AN TOÀN KHI CHẠY LẶP LẠI NHIỀU LẦN).
-- =========================================================================

-- BƯỚC 1: KÍCH HOẠT EXTENSION HỖ TRỢ UUID (NẾU CHƯA CÓ)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- BƯỚC 2: TẠO BẢNG NOTIFICATIONS VÀ KHẮC PHỤC LỖI THIẾU BẢNG TRÊN CLOUD
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    recipient_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    sender_name TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    item_id TEXT REFERENCES public.items(id) ON DELETE SET NULL,
    request_id TEXT REFERENCES public.requests(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- BƯỚC 3: RÀNG BUỘC TOÀN VẸN VÀ CHỈ MỤC CHỐNG XUNG ĐỘT (CONSTRAINTS & INDEXES)
-- =========================================================================

-- 3.1. Chống gửi nhiều yêu cầu trùng lặp cho cùng 1 món đồ từ 1 học sinh
CREATE UNIQUE INDEX IF NOT EXISTS uq_requests_item_requester 
ON public.requests(item_id, requester_id) 
WHERE status != 'rejected';

-- 3.2. Chống Race Condition: Ngăn 2 món đồ cùng chiếm 1 ô kệ lưu trữ tại trạm
CREATE UNIQUE INDEX IF NOT EXISTS uq_items_occupied_slot 
ON public.items(storage_slot) 
WHERE status = 'stored' AND storage_slot IS NOT NULL;

-- 3.3. Đảm bảo mã nhận đồ 4 số là duy nhất trong các lịch hẹn đang hoạt động
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_active_pickup_code 
ON public.appointments(pickup_code) 
WHERE status IN ('scheduled', 'ready_for_pickup');

-- 3.4. Chỉ mục tối ưu hiệu năng truy vấn danh mục đồ dùng theo trạng thái và thời gian
CREATE INDEX IF NOT EXISTS idx_items_status_category 
ON public.items(status, category, created_at DESC);

-- 3.5. Chỉ mục thông báo người dùng theo trạng thái chưa đọc
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread 
ON public.notifications(recipient_id, is_read, created_at DESC);

-- =========================================================================
-- BƯỚC 4: THÊM BẢNG NOTIFICATIONS VÀO SUPABASE REALTIME PUBLICATION
-- =========================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;

-- =========================================================================
-- BƯỚC 5: CÁC STORED PROCEDURES / RPC TRANSACTIONS ĐẢM BẢO TÍNH TOÀN VẸN ACID
-- =========================================================================

-- 5.1. RPC: Người cho đồng ý trao đồ (Giao dịch nguyên tử 3 bảng: requests, items, notifications)
CREATE OR REPLACE FUNCTION public.rpc_accept_request_by_donor(
    p_request_id TEXT,
    p_donor_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req RECORD;
    v_item RECORD;
    v_donor RECORD;
BEGIN
    -- Lấy thông tin request và khóa dòng
    SELECT * INTO v_req FROM public.requests WHERE id = p_request_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy yêu cầu nhận đồ!');
    END IF;

    -- Lấy thông tin món đồ
    SELECT * INTO v_item FROM public.items WHERE id = v_req.item_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy món đồ tương ứng!');
    END IF;

    -- Kiểm tra quyền người cho
    IF v_item.donor_id != p_donor_id THEN
        RETURN jsonb_build_object('success', false, 'message', 'Bạn không phải là người đăng món đồ này!');
    END IF;

    SELECT * INTO v_donor FROM public.users WHERE id = p_donor_id;

    -- Cập nhật request được chọn thành selected, các request khác thành backup
    UPDATE public.requests 
    SET status = 'selected', lottery_rank = 1 
    WHERE id = p_request_id;

    UPDATE public.requests 
    SET status = 'backup', lottery_rank = 2 
    WHERE item_id = v_item.id AND id != p_request_id;

    -- Đóng đợt nhận và chuyển trạng thái món đồ sang matching
    UPDATE public.items 
    SET status = 'matching', request_status = 'closed' 
    WHERE id = v_item.id;

    -- Tự động gửi thông báo Cloud cho Người Nhận
    INSERT INTO public.notifications (
        recipient_id, sender_id, sender_name, type, title, message, item_id, request_id
    ) VALUES (
        v_req.requester_id,
        p_donor_id,
        COALESCE(v_donor.name, 'Người tặng'),
        'request_accepted',
        'Yêu cầu được chấp thuận! 🎉',
        'Món đồ "' || v_item.title || '" đã được người tặng đồng ý trao cho bạn. Vui lòng theo dõi lịch hẹn!',
        v_item.id,
        v_req.id
    );

    -- Ghi nhật ký hệ thống
    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES (
        'LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
        NOW(),
        COALESCE(v_donor.name, p_donor_id),
        'CHẤP THUẬN YÊU CẦU (RPC)',
        'Người cho ' || p_donor_id || ' đã chấp thuận yêu cầu ' || p_request_id || ' cho món ' || v_item.id
    );

    RETURN jsonb_build_object('success', true, 'item_id', v_item.id, 'request_id', p_request_id);
END;
$$;

-- 5.2. RPC: Quản sinh kiểm tra & tiếp nhận đồ vào ô kệ Trạm (Chống Race Condition ô kệ)
CREATE OR REPLACE FUNCTION public.rpc_inspect_and_receive_item(
    p_apt_id TEXT,
    p_passed BOOLEAN,
    p_note TEXT,
    p_storage_slot TEXT,
    p_checker_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_apt RECORD;
    v_item RECORD;
    v_slot_occupied BOOLEAN;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_apt FROM public.appointments WHERE id = p_apt_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy lịch hẹn tiếp nhận!');
    END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_apt.item_id FOR UPDATE;

    IF p_passed THEN
        -- Nếu là lưu kho tạm thời: kiểm tra ô kệ có bị chiếm không
        IF v_apt.type != 'direct' THEN
            IF p_storage_slot IS NULL OR TRIM(p_storage_slot) = '' THEN
                RETURN jsonb_build_object('success', false, 'message', 'Vui lòng chọn ô kệ lưu trữ!');
            END IF;

            SELECT EXISTS (
                SELECT 1 FROM public.items 
                WHERE storage_slot = p_storage_slot AND status = 'stored' AND id != v_item.id
            ) INTO v_slot_occupied;

            IF v_slot_occupied THEN
                RETURN jsonb_build_object('success', false, 'message', 'Ô kệ ' || p_storage_slot || ' hiện đã có đồ lưu trữ! Vui lòng chọn ô khác.');
            END IF;
        END IF;

        -- Cập nhật appointment
        UPDATE public.appointments 
        SET status = 'ready_for_pickup',
            donor_arrived_at = v_now,
            storage_slot = CASE WHEN v_apt.type = 'direct' THEN NULL ELSE p_storage_slot END,
            notes = COALESCE(notes, '') || ' [Đạt kiểm tra: ' || COALESCE(p_note, 'Tốt') || ']'
        WHERE id = p_apt_id;

        -- Cập nhật món đồ
        UPDATE public.items 
        SET status = CASE WHEN v_apt.type = 'direct' THEN 'matching' ELSE 'stored' END,
            storage_slot = CASE WHEN v_apt.type = 'direct' THEN NULL ELSE p_storage_slot END,
            quality_check = jsonb_build_object('passed', true, 'note', p_note, 'checkedBy', p_checker_id)
        WHERE id = v_item.id;

        -- Gửi thông báo cho người nhận biết đồ đã có tại trạm
        INSERT INTO public.notifications (
            recipient_id, sender_id, sender_name, type, title, message, item_id
        ) VALUES (
            v_apt.requester_id,
            p_checker_id,
            'Quản sinh Trạm Lê Lợi',
            'item_ready',
            'Đồ dùng đã sẵn sàng nhận tại Trạm! 📦',
            'Món đồ "' || v_item.title || '" đã được bàn giao tại Phòng Đội' || 
            CASE WHEN p_storage_slot IS NOT NULL THEN ' (Ô kệ: ' || p_storage_slot || ')' ELSE '' END || 
            '. Mã nhận của bạn: ' || v_apt.pickup_code,
            v_item.id
        );

        RETURN jsonb_build_object('success', true, 'status', 'ready_for_pickup', 'slot', p_storage_slot);
    ELSE
        -- Không đạt kiểm tra thực tế
        UPDATE public.appointments 
        SET status = 'failed_inspection',
            notes = COALESCE(notes, '') || ' [Không đạt: ' || COALESCE(p_note, 'Không rõ lý do') || ']'
        WHERE id = p_apt_id;

        UPDATE public.items 
        SET status = 'rejected',
            reject_reason = 'Không đạt kiểm tra thực tế: ' || COALESCE(p_note, 'Không rõ lý do'),
            quality_check = jsonb_build_object('passed', false, 'note', p_note, 'checkedBy', p_checker_id)
        WHERE id = v_item.id;

        RETURN jsonb_build_object('success', true, 'status', 'failed_inspection');
    END IF;
END;
$$;

-- 5.3. RPC: Hoàn tất bàn giao và vô hiệu hóa mã nhận đồ (Ngăn bàn giao trùng lặp)
CREATE OR REPLACE FUNCTION public.rpc_complete_handover(
    p_pickup_code TEXT,
    p_operator_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_code TEXT := UPPER(TRIM(p_pickup_code));
    v_apt RECORD;
    v_item RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_apt FROM public.appointments WHERE UPPER(pickup_code) = v_code FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Mã nhận đồ không tồn tại!');
    END IF;

    IF v_apt.status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Mã nhận đồ này ĐÃ ĐƯỢC BÀN GIAO trước đó và đã bị vô hiệu hóa an toàn!');
    END IF;

    IF v_apt.status IN ('cancelled', 'failed_inspection') THEN
        RETURN jsonb_build_object('success', false, 'message', 'Lịch hẹn đã bị hủy hoặc kiểm định không đạt!');
    END IF;

    SELECT * INTO v_item FROM public.items WHERE id = v_apt.item_id FOR UPDATE;

    -- Cập nhật hoàn tất lịch hẹn và giải phóng ô kệ
    UPDATE public.appointments 
    SET status = 'completed',
        picked_up_at = v_now,
        storage_slot = NULL
    WHERE id = v_apt.id;

    -- Cập nhật món đồ thành completed và giải phóng ô kệ
    UPDATE public.items 
    SET status = 'completed',
        storage_slot = NULL
    WHERE id = v_item.id;

    -- Ghi nhật ký kiểm toán
    INSERT INTO public.logs (id, timestamp, role, action, details)
    VALUES (
        'LOG-' || SUBSTRING(gen_random_uuid()::text, 1, 8),
        v_now,
        p_operator_id,
        'BÀN GIAO THÀNH CÔNG (RPC)',
        'Đã bàn giao món ' || v_item.id || ' (' || v_item.title || ') cho học sinh ' || v_apt.requester_id || '. Mã ' || v_apt.pickup_code || ' đã vô hiệu hóa an toàn.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'item_title', v_item.title,
        'requester_id', v_apt.requester_id,
        'completed_at', v_now
    );
END;
$$;

-- =========================================================================
-- BƯỚC 6: CHÍNH SÁCH BẢO MẬT ROW LEVEL SECURITY (RLS) THEO QUYỀN THỰC TẾ
-- =========================================================================

-- Kích hoạt RLS trên tất cả bảng
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6.1. Bảng Notifications: Chỉ người nhận mới được đọc và đánh dấu đã đọc
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
FOR SELECT USING (
    auth.uid()::text = recipient_id 
    OR auth.role() = 'service_role'
    OR (SELECT role FROM public.users WHERE id = auth.uid()::text) IN ('teacher', 'admin', 'station_staff')
);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid()::text = recipient_id);

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- 6.2. Cấp quyền thực thi các hàm RPC cho role authenticated và anon
GRANT EXECUTE ON FUNCTION public.rpc_accept_request_by_donor(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_complete_handover(TEXT, TEXT) TO authenticated, anon;

-- =========================================================================
-- KẾ HOẠCH ROLLBACK (HƯỚNG DẪN KHI CẦN HỦY THAY ĐỔI)
-- =========================================================================
-- 1. Xóa các chỉ mục Unique chống trùng:
--    DROP INDEX IF EXISTS uq_requests_item_requester;
--    DROP INDEX IF EXISTS uq_items_occupied_slot;
--    DROP INDEX IF EXISTS uq_appointments_active_pickup_code;
--    DROP INDEX IF EXISTS idx_items_status_category;
--    DROP INDEX IF EXISTS idx_notifications_recipient_unread;
--
-- 2. Xóa các hàm Stored Procedure:
--    DROP FUNCTION IF EXISTS public.rpc_accept_request_by_donor(TEXT, TEXT);
--    DROP FUNCTION IF EXISTS public.rpc_inspect_and_receive_item(TEXT, BOOLEAN, TEXT, TEXT, TEXT);
--    DROP FUNCTION IF EXISTS public.rpc_complete_handover(TEXT, TEXT);
--
-- 3. Xóa bảng notifications (nếu cần hoàn tác):
--    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
--    DROP TABLE IF EXISTS public.notifications;

